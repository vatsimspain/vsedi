import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { app, IpcMainInvokeEvent } from 'electron';
import type { InstallPayload, InstallProgress, InstallResult, SavedConfig } from './types/install.types';
import { RATING_MAP } from '../const/ratingMap';
import { EXTRAS } from '../const/extras.config';

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
  fs.writeFileSync(getConfigPath(), JSON.stringify({ ...readConfig(), ...data }, null, 2), 'utf8');
}

export function loadConfig(_event: IpcMainInvokeEvent): SavedConfig {
  return readConfig();
}

export function saveConfig(_event: IpcMainInvokeEvent, data: SavedConfig): void {
  writeConfig(data);
}

function get(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'vsedi-installer' } }, (res) => {
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
    }).on('error', reject);
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

function installFont(assetPath: string): Promise<void> {
  const src = path.join(getAssetsPath(), assetPath);
  const fontName = path.basename(assetPath, path.extname(assetPath));
  const cmd = [
    `$src = '${src.replace(/'/g, "''")}'`,
    `$dst = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Fonts\\${path.basename(assetPath)}"`,
    `Copy-Item -LiteralPath $src -Destination $dst -Force`,
    `$reg = 'HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'`,
    `New-ItemProperty -Path $reg -Name '${fontName} (TrueType)' -Value $dst -PropertyType String -Force | Out-Null`,
  ].join('; ');

  return new Promise((resolve, reject) => {
    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', cmd]);
    let stderr = '';
    ps.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Font install exited with code ${code}`));
    });
    ps.on('error', reject);
  });
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

function extractZip(zipPath: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsedi-'));

    const cmd = [
      `$tmp = '${tmpDir.replace(/'/g, "''")}'`,
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath $tmp -Force`,
      `$items = @(Get-ChildItem -LiteralPath $tmp)`,
      `$src = if ($items.Count -eq 1 -and $items[0].PSIsContainer) { $items[0].FullName } else { $tmp }`,
      `Get-ChildItem -LiteralPath $src | Move-Item -Destination '${destPath.replace(/'/g, "''")}' -Force`,
      `Remove-Item -LiteralPath $tmp -Recurse -Force`,
    ].join('; ');

    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', cmd]);
    let stderr = '';
    ps.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `PowerShell exited with code ${code}`));
    });
    ps.on('error', reject);
  });
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

function patchPrfFiles(
  folder: string,
  name: string,
  cid: string,
  password: string,
  rank: string,
  hoppieCode: string
): void {
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
    fs.writeFileSync(prfPath, newContent, 'latin1');
  }
}

const HOPPIE_SECTORS = ['LECM', 'LECB', 'GCCC'];

function createHoppieFiles(folder: string, hoppieCode: string): void {
  for (const sector of HOPPIE_SECTORS) {
    const dir = path.join(folder, sector, 'Plugins', 'TopSky');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'TopSkyCPDLChoppieCode.txt'), hoppieCode, 'utf8');
  }
}

export async function runInstall(
  event: IpcMainInvokeEvent,
  payload: InstallPayload,
): Promise<InstallResult> {
  const { overwriteSettings, destFolder, name, cid, password, rank, hoppieCode } = payload;
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

    const assetName = overwriteSettings ? 'data_install.zip' : 'data_update.zip';
    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset) throw new Error(`No se encontró el asset "${assetName}" en el release.`);
    const airacAsset = release.assets.find((a) => a.name === 'airacData.txt');

    // 2. Download
    send({ stage: 'downloading', percent: 0 });
    await downloadWithProgress(asset.browser_download_url, tmpPath, (pct) => {
      send({ stage: 'downloading', percent: pct });
    });

    // 3. Extract
    send({ stage: 'extracting', percent: 0 });
    await extractZip(tmpPath, destFolder);

    // 4. Patch .prf files with user credentials
    patchPrfFiles(destFolder, name, cid, password, rank, hoppieCode);
    createHoppieFiles(destFolder, hoppieCode);

    // 5. Cleanup
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }

    // 6. Save installed AIRACs to config
    if (airacAsset) {
      try {
        const airacText = (await get(airacAsset.browser_download_url)).toString('utf8');
        const installedAiracs: Record<string, string> = {};
        for (const line of airacText.split(/\r?\n/).filter(Boolean)) {
          const match = line.match(/^([^-]+)-AIRAC_(\d{8})$/);
          if (match) installedAiracs[match[1].trim()] = match[2];
        }
        writeConfig({ installedAiracs });
      } catch {
        // non-fatal: ignore AIRAC save error
      }
    }

    // 7. Install selected extras (independently — failures don't abort the rest)
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
            await runSilentInstaller(extraConfig.localPath, extraConfig.installArgs);
          } else {
            let downloadUrl: string;
            if (extraConfig.source === 'github') {
              const apiUrl = extraConfig.releaseTag === 'latest'
                ? `https://api.github.com/repos/${extraConfig.githubRepo}/releases/latest`
                : `https://api.github.com/repos/${extraConfig.githubRepo}/releases/tags/${extraConfig.releaseTag}`;
              const rawExtra = await get(apiUrl);
              const releaseExtra = JSON.parse(rawExtra.toString()) as {
                assets: { name: string; browser_download_url: string }[];
              };
              const extraAsset = releaseExtra.assets.find((a) =>
                extraConfig.assetPattern.test(a.name),
              );
              if (!extraAsset) throw new Error(`Asset no encontrado para ${extraConfig.name}`);
              downloadUrl = extraAsset.browser_download_url;
            } else {
              downloadUrl = extraConfig.downloadUrl;
            }
            const extraTmp = path.join(os.tmpdir(), `vsedi-extra-${extraConfig.id}.exe`);
            await downloadWithProgress(downloadUrl, extraTmp, () => {});
            await runSilentInstaller(extraTmp, extraConfig.installArgs);
            try { fs.unlinkSync(extraTmp); } catch { /* ignore */ }
          }
          send({ stage: 'extras', percent: 100, extraId, extraStatus: 'done' });
        } catch (extraErr) {
          send({ stage: 'extras', percent: 0, extraId, extraStatus: 'error', extraError: (extraErr as Error).message });
        }
      }
    }

    send({ stage: 'done', percent: 100 });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
