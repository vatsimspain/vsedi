import { spawn } from 'child_process';
import { app, IpcMainInvokeEvent } from 'electron';
import fs from 'fs';
import http from 'http';
import https from 'https';
import os from 'os';
import path from 'path';
import { EXTRAS } from '../const/extras.config';
import { RATING_MAP } from '../const/ratingMap';
import type {
  InstallPayload,
  InstallProgress,
  InstallResult,
  SavedConfig,
} from './types/install.types';

const GITHUB_API =
  'https://api.github.com/repos/vatsimspain/Operaciones/releases/tags/vsedi';

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'vsedi-config.json');
}

function readConfig(): SavedConfig {
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8')) as SavedConfig;
  } catch {
    return {};
  }
}

function writeConfig(data: Partial<SavedConfig>): void {
  fs.writeFileSync(
    getConfigPath(),
    JSON.stringify({ ...readConfig(), ...data }, null, 2),
    'utf8',
  );
}

export function loadConfig(_event: IpcMainInvokeEvent): SavedConfig {
  return readConfig();
}

export function saveConfig(
  _event: IpcMainInvokeEvent,
  data: SavedConfig,
): void {
  writeConfig(data);
}

export function get(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, { headers: { 'User-Agent': 'vsedi-installer' } }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(get(res.headers.location));
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function downloadWithProgress(
  url: string,
  dest: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, { headers: { 'User-Agent': 'vsedi-installer' } }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(
            downloadWithProgress(res.headers.location, dest, onProgress),
          );
        }
        const total = parseInt(res.headers['content-length'] ?? '0', 10);
        let received = 0;
        const file = fs.createWriteStream(dest);
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (total > 0) onProgress(Math.round((received / total) * 100));
          file.write(chunk);
        });
        res.on('end', () => file.end(() => resolve()));
        res.on('error', (err) => {
          file.destroy();
          reject(err);
        });
      })
      .on('error', reject);
  });
}

function getAssetsPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');
}

// Runs a PowerShell command string. When elevated=true, triggers a UAC prompt
// and runs the command in an elevated child process via Start-Process -Verb RunAs.
function runPowerShell(cmd: string, elevated = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (elevated) {
      const tmpScript = path.join(os.tmpdir(), `vsedi-ps-${Date.now()}.ps1`);
      try {
        fs.writeFileSync(tmpScript, cmd, 'utf8');
      } catch (err) {
        reject(err);
        return;
      }
      const cleanup = () => {
        try {
          fs.unlinkSync(tmpScript);
        } catch {
          /* ignore */
        }
      };
      const elevateCmd = `$proc = Start-Process powershell -ArgumentList @('-NoProfile', '-NonInteractive', '-File', '${tmpScript.replace(/'/g, "''")}') -Verb RunAs -Wait -PassThru; exit $proc.ExitCode`;
      const ps = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        elevateCmd,
      ]);
      ps.on('close', (code) => {
        cleanup();
        if (code === 0) resolve();
        else
          reject(new Error(`PowerShell (elevated) exited with code ${code}`));
      });
      ps.on('error', (err) => {
        cleanup();
        reject(err);
      });
    } else {
      const ps = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        cmd,
      ]);
      let stderr = '';
      ps.stderr.on('data', (d: Buffer) => {
        stderr += d.toString();
      });
      ps.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr || `PowerShell exited with code ${code}`));
      });
      ps.on('error', reject);
    }
  });
}

// Writes a file, retrying with an elevated UAC prompt on permission errors.
// Uses a temp-file-then-move strategy to avoid encoding issues with Set-Content.
async function writeFileSafe(
  filePath: string,
  content: string,
  encoding: BufferEncoding,
): Promise<void> {
  try {
    fs.writeFileSync(filePath, content, encoding);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'EACCES' && code !== 'EPERM') throw err;
    const tmpFile = path.join(os.tmpdir(), `vsedi-write-${Date.now()}.tmp`);
    fs.writeFileSync(tmpFile, content, encoding);
    const cmd = `Move-Item -LiteralPath '${tmpFile.replace(/'/g, "''")}' -Destination '${filePath.replace(/'/g, "''")}' -Force`;
    await runPowerShell(cmd, true);
  }
}

// Creates a directory, retrying elevated on permission errors.
async function mkdirSafe(dir: string): Promise<void> {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'EACCES' && code !== 'EPERM') throw err;
    const cmd = `New-Item -ItemType Directory -Force -LiteralPath '${dir.replace(/'/g, "''")}'`;
    await runPowerShell(cmd, true);
  }
}

async function installFont(assetPath: string): Promise<void> {
  const src = path.join(getAssetsPath(), assetPath);
  const fontName = path.basename(assetPath, path.extname(assetPath));
  const cmd = [
    `$src = '${src.replace(/'/g, "''")}'`,
    `$dst = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Fonts\\${path.basename(assetPath)}"`,
    `Copy-Item -LiteralPath $src -Destination $dst -Force`,
    `$reg = 'HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'`,
    `New-ItemProperty -Path $reg -Name '${fontName} (TrueType)' -Value $dst -PropertyType String -Force | Out-Null`,
  ].join('; ');

  await runPowerShell(cmd).catch(() => runPowerShell(cmd, true));
}

function runSilentInstaller(exePath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(exePath, args, { detached: false });
    proc.on('close', (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`Installer exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function extractZip(zipPath: string, destPath: string): Promise<void> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsedi-'));
  const cmd = [
    `$tmp = '${tmpDir.replace(/'/g, "''")}'`,
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath $tmp -Force`,
    `$items = @(Get-ChildItem -LiteralPath $tmp)`,
    `$src = if ($items.Count -eq 1 -and $items[0].PSIsContainer) { $items[0].FullName } else { $tmp }`,
    `Get-ChildItem -LiteralPath $src | Move-Item -Destination '${destPath.replace(/'/g, "''")}' -Force`,
    `Remove-Item -LiteralPath $tmp -Recurse -Force`,
  ].join('; ');

  await runPowerShell(cmd).catch(() => runPowerShell(cmd, true));
}

const FONT_SIZE_VALUES: Record<'small' | 'medium' | 'large', string> = {
  small: '3.0',
  medium: '3.5',
  large: '4.0',
};

const SYMBOLOGY_FONT_ENTRIES = [
  'Metar:normal',
  'Metar:modified',
  'Metar:timeout',
  'Other:list header',
  'Chat:text',
  'Chat:name normal',
  'Chat:name unread',
];

function findSymbologyFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findSymbologyFiles(full));
    else if (entry.name === 'SIMBOLOGY.txt') results.push(full);
  }
  return results;
}

async function patchSymbologyFontSize(
  folder: string,
  fontSize: 'small' | 'medium' | 'large',
): Promise<void> {
  const sizeValue = FONT_SIZE_VALUES[fontSize];
  if (!sizeValue) return;
  const targetEntries = new Set(SYMBOLOGY_FONT_ENTRIES);
  for (const filePath of findSymbologyFiles(folder)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    let changed = false;

    const updatedLines = lines.map((line) => {
      const parts = line.split(':');
      if (parts.length < 4) return line;
      const key = `${parts[0]}:${parts[1]}`;
      if (!targetEntries.has(key)) return line;
      if (parts[3] === sizeValue) return line;
      parts[3] = sizeValue;
      changed = true;
      return parts.join(':');
    });

    if (changed)
      await writeFileSafe(filePath, updatedLines.join(lineEnding), 'utf8');
  }
}

function findPrfFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findPrfFiles(full));
    else if (entry.name.toLowerCase().endsWith('.prf')) results.push(full);
  }
  return results;
}

async function patchPrfFiles(
  folder: string,
  name: string,
  cid: string,
  password: string,
  rank: string,
  hoppieCode: string,
): Promise<void> {
  const rating = RATING_MAP[rank] ?? 1;
  const injected = [
    `LastSession\trealname\t${name}`,
    `LastSession\tcertificate\t${cid}`,
    `LastSession\tpassword\t${password}`,
    `LastSession\tserver\tAUTOMATIC`,
    `LastSession\trating\t${rating}`,
    `TeamSpeakVccs\tTs3NickName\t${name + ' - ' + cid}`,
  ];
  const prefixes = injected.map((l) => l.split('\t').slice(0, 2).join('\t'));

  for (const prfPath of findPrfFiles(folder)) {
    const raw = fs.readFileSync(prfPath, 'latin1');
    const lines = raw
      .split(/\r?\n/)
      .filter((l) => !prefixes.some((p) => l.startsWith(p)));
    const newContent = [...lines, ...injected].join('\r\n');
    await writeFileSafe(prfPath, newContent, 'latin1');
  }
}

const HOPPIE_SECTORS = ['LECM', 'LECB', 'GCCC'];

async function createHoppieFiles(
  folder: string,
  hoppieCode: string,
): Promise<void> {
  for (const sector of HOPPIE_SECTORS) {
    const dir = path.join(folder, sector, 'Plugins', 'TopSky');
    await mkdirSafe(dir);
    await writeFileSafe(
      path.join(dir, 'TopSkyCPDLChoppieCode.txt'),
      hoppieCode,
      'utf8',
    );
  }
}

export async function installEuroscopeMsi(
  event: IpcMainInvokeEvent,
  url: string,
): Promise<{ success: boolean; error?: string }> {
  const tmpPath = path.join(os.tmpdir(), `vsedi-euroscope-${Date.now()}.msi`);
  try {
    await downloadWithProgress(url, tmpPath, (pct) => {
      event.sender.send('euroscope:install:progress', {
        stage: 'downloading',
        percent: pct,
      });
    });
    event.sender.send('euroscope:install:progress', {
      stage: 'installing',
      percent: 0,
    });
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('msiexec', ['/i', tmpPath]);
      proc.on('close', (code) => {
        // 0=success, 1602=user cancelled, 3010=success+reboot required
        if (code === 0 || code === 1602 || code === 3010 || code === null)
          resolve();
        else reject(new Error(`msiexec salió con código ${code}`));
      });
      proc.on('error', reject);
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}

type AiracFileEntry = { date: string; cycle: string };

function scanAiracsInDir(
  dir: string,
  result: Record<string, AiracFileEntry[]>,
): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanAiracsInDir(full, result);
    } else {
      const ext = entry.name.split('.').pop()?.toLowerCase();
      if (ext !== 'sct' && ext !== 'ese') continue;
      const dateMatch = entry.name.match(/([A-Z]+)-AIRAC_(\d{8})/i);
      if (!dateMatch) continue;
      const fir = dateMatch[1].toUpperCase();
      const date = dateMatch[2];
      // Extract AIRAC cycle from filename segment like "-260501-": first 4 chars = cycle (e.g. "2605")
      const cycleMatch = entry.name.match(/AIRAC_\d{14}-(\d{4})\d{2}-/);
      const cycle = cycleMatch ? cycleMatch[1] : '';
      if (!result[fir]) result[fir] = [];
      if (!result[fir].some((e) => e.date === date))
        result[fir].push({ date, cycle });
    }
  }
}

export function scanInstalledAiracs(
  _event: IpcMainInvokeEvent,
  sectorsFolder: string,
): Record<string, AiracFileEntry[]> {
  const result: Record<string, AiracFileEntry[]> = {};
  try {
    if (sectorsFolder && fs.existsSync(sectorsFolder))
      scanAiracsInDir(sectorsFolder, result);
  } catch {
    /* ignore */
  }
  return result;
}

export async function runInstall(
  event: IpcMainInvokeEvent,
  payload: InstallPayload,
): Promise<InstallResult> {
  const {
    overwriteSettings,
    destFolder,
    name,
    cid,
    password,
    rank,
    hoppieCode,
    fontSize,
  } = payload;
  const send = (progress: InstallProgress) =>
    event.sender.send('install:progress', progress);

  const tmpPath = path.join(
    os.tmpdir(),
    overwriteSettings ? 'data_install.zip' : 'data_update.zip',
  );

  try {
    // 1. Fetch release metadata
    send({ stage: 'fetching', percent: 0 });
    const raw = await get(GITHUB_API);
    const release = JSON.parse(raw.toString()) as {
      assets: { name: string; browser_download_url: string }[];
    };

    const assetName = overwriteSettings
      ? 'data_install.zip'
      : 'data_update.zip';
    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset)
      throw new Error(`No se encontró el asset "${assetName}" en el release.`);

    // 2. Download
    send({ stage: 'downloading', percent: 0 });
    await downloadWithProgress(asset.browser_download_url, tmpPath, (pct) => {
      send({ stage: 'downloading', percent: pct });
    });

    // 3. Extract (retries elevated via UAC if destination is write-protected)
    send({ stage: 'extracting', percent: 0 });
    await extractZip(tmpPath, destFolder);

    // 4. Patch .prf files with user credentials (retries elevated on EACCES/EPERM)
    await patchPrfFiles(destFolder, name, cid, password, rank, hoppieCode);
    await createHoppieFiles(destFolder, hoppieCode);
    await patchSymbologyFontSize(destFolder, fontSize);

    // 5. Cleanup
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }

    // 6. Save user config
    writeConfig({
      name,
      cid,
      password,
      rank,
      hoppieCode,
      fontSize,
      sectorsFolder: destFolder,
      overwriteSettings,
    });

    // 7. Install selected extras (independently, failures don't abort the rest)
    if (payload.extras.length > 0) {
      send({ stage: 'extras', percent: 0 });
      for (const extraId of payload.extras) {
        const extraConfig = EXTRAS.find((e) => e.id === extraId);
        if (!extraConfig) continue;

        send({ stage: 'extras', percent: 0, extraId, extraStatus: 'running' });
        try {
          if (extraConfig.source === 'font') {
            await installFont(extraConfig.assetPath);
          } else if (extraConfig.source === 'local') {
            await runSilentInstaller(
              extraConfig.localPath,
              extraConfig.installArgs,
            );
          } else {
            let downloadUrl: string;
            if (extraConfig.source === 'github') {
              let releaseExtra: {
                assets: { name: string; browser_download_url: string }[];
                prerelease?: boolean;
              };
              if (extraConfig.releaseTag === 'latest') {
                const rawReleases = await get(
                  `https://api.github.com/repos/${extraConfig.githubRepo}/releases`,
                );
                const releases = JSON.parse(rawReleases.toString()) as {
                  tag_name: string;
                  prerelease: boolean;
                  draft: boolean;
                  assets: { name: string; browser_download_url: string }[];
                }[];
                const unstablePattern = /beta|alpha|rc|pre|dev/i;
                const stable = releases.find(
                  (r) =>
                    !r.prerelease &&
                    !r.draft &&
                    !unstablePattern.test(r.tag_name),
                );
                if (!stable)
                  throw new Error(
                    `No se encontró versión estable para ${extraConfig.name}`,
                  );
                releaseExtra = stable;
              } else {
                const rawExtra = await get(
                  `https://api.github.com/repos/${extraConfig.githubRepo}/releases/tags/${extraConfig.releaseTag}`,
                );
                releaseExtra = JSON.parse(rawExtra.toString()) as {
                  assets: { name: string; browser_download_url: string }[];
                };
              }
              const extraAsset = releaseExtra.assets.find((a) =>
                extraConfig.assetPattern.test(a.name),
              );
              if (!extraAsset)
                throw new Error(`Asset no encontrado para ${extraConfig.name}`);
              downloadUrl = extraAsset.browser_download_url;
            } else {
              downloadUrl = extraConfig.downloadUrl;
            }
            const extraTmp = path.join(
              os.tmpdir(),
              `vsedi-extra-${extraConfig.id}.exe`,
            );
            await downloadWithProgress(downloadUrl, extraTmp, () => {});
            await runSilentInstaller(extraTmp, extraConfig.installArgs);
            try {
              fs.unlinkSync(extraTmp);
            } catch {
              /* ignore */
            }
          }
          send({ stage: 'extras', percent: 100, extraId, extraStatus: 'done' });
        } catch (extraErr) {
          send({
            stage: 'extras',
            percent: 0,
            extraId,
            extraStatus: 'error',
            extraError: (extraErr as Error).message,
          });
        }
      }
    }

    send({ stage: 'done', percent: 100 });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
