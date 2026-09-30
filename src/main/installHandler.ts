import { spawn, execSync } from 'child_process';
import { app, IpcMainInvokeEvent, shell } from 'electron';
import log from 'electron-log';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import os from 'os';
import path from 'path';
import { EXTRAS } from '../const/extras.config';
import { RATING_MAP } from '../const/ranks';
import type {
  InstallPayload,
  InstallProgress,
  InstallResult,
  SavedConfig,
} from './types/install.types';

const GITHUB_API =
  'https://api.github.com/repos/vatsimspain/Operaciones/releases/tags/vsedi';

const REQUEST_TIMEOUT_MS = 30000;
const DOWNLOAD_IDLE_TIMEOUT_MS = 60000;

// Hidden BETA channel: same release as the public one, just an extra asset
// ("beta_install.zip.enc") sitting alongside data_install.zip/data_update.zip,
// encrypted with AES-256-GCM (see scripts/encrypt-beta-package.js). The
// password typed into the hidden "Modo BETA" field is never stored
// anywhere — it's only ever used to attempt a decrypt, which fails cleanly
// if it's wrong.

// Reverses the layout written by scripts/encrypt-beta-package.js:
// [16-byte salt][12-byte IV][16-byte GCM auth tag][ciphertext].
function decryptBetaPackage(encrypted: Buffer, password: string): Buffer {
  const salt = encrypted.subarray(0, 16);
  const iv = encrypted.subarray(16, 28);
  const authTag = encrypted.subarray(28, 44);
  const ciphertext = encrypted.subarray(44);
  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  // Throws if the password is wrong (the GCM auth tag won't verify).
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// Dedicated log file for install/update operations, separate from the
// auto-updater's main.log, so users can send just this one for support.
const installLog = log.create({ logId: 'vsedi-install' });
installLog.transports.file.fileName = 'vsedi-log.log';
// Reset on every app launch so the file only ever holds the current session.
installLog.transports.file.getFile().clear();

export async function openLogFile(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const logPath = installLog.transports.file.getFile().path;
    const openError = await shell.openPath(logPath);
    if (openError) throw new Error(openError);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// Checks whether EuroScope.exe is currently running. Used both to fail fast
// from runInstall() and to let the renderer warn the user before it even
// attempts to write sector files EuroScope may have open/locked.
export function isEuroscopeRunning(): boolean {
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq EuroScope.exe" /NH', {
      encoding: 'utf8',
      timeout: 3000,
      windowsHide: true,
    });
    return /euroscope\.exe/i.test(out);
  } catch {
    // If tasklist itself fails for some reason, don't block the install on it.
    return false;
  }
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'vsedi-config.json');
}

export function readConfig(): SavedConfig {
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

function getDefaultEuroscopeExePath(): string | null {
  const bases = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles];
  const found = bases
    .filter((base): base is string => !!base)
    .map((base) => path.join(base, 'EuroScope', 'EuroScope.exe'))
    .find((candidate) => fs.existsSync(candidate));
  return found ?? null;
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
    const req = mod.get(
      url,
      { headers: { 'User-Agent': 'vsedi-installer' } },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(get(res.headers.location));
        }
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(
            new Error(
              `Petición fallida: servidor devolvió HTTP ${res.statusCode ?? 'desconocido'}`,
            ),
          );
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      },
    );
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(
        new Error(
          'La petición tardó demasiado en responder. Comprueba tu conexión a internet.',
        ),
      );
    });
    req.on('error', reject);
  });
}

// Used by the menu to only show the hidden "Modo BETA" toggle when there's
// actually a beta build published — no point offering a password prompt for
// a channel that has nothing to install.
export async function isBetaChannelAvailable(): Promise<boolean> {
  try {
    const raw = await get(GITHUB_API);
    const release = JSON.parse(raw.toString()) as {
      assets: { name: string }[];
    };
    return release.assets.some((a) => a.name === 'beta_install.zip.enc');
  } catch {
    return false;
  }
}

export function downloadWithProgress(
  url: string,
  dest: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const clearIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = null;
    };
    const armIdleTimer = (onTimeout: () => void): void => {
      clearIdleTimer();
      idleTimer = setTimeout(onTimeout, DOWNLOAD_IDLE_TIMEOUT_MS);
    };
    const req = mod.get(
      url,
      { headers: { 'User-Agent': 'vsedi-installer' } },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          clearIdleTimer();
          return resolve(
            downloadWithProgress(res.headers.location, dest, onProgress),
          );
        }
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          clearIdleTimer();
          return reject(
            new Error(
              `Descarga fallida: servidor devolvió HTTP ${res.statusCode ?? 'desconocido'}`,
            ),
          );
        }
        const total = parseInt(res.headers['content-length'] ?? '0', 10);
        let received = 0;
        let file: fs.WriteStream;
        try {
          file = fs.createWriteStream(dest);
        } catch (err) {
          res.resume();
          clearIdleTimer();
          return reject(err);
        }
        let errored = false;
        const onIdleTimeout = () => {
          if (!errored) {
            errored = true;
            file.destroy();
            reject(
              new Error(
                'La descarga se interrumpió por inactividad en la red. Comprueba tu conexión e inténtalo de nuevo.',
              ),
            );
          }
        };
        armIdleTimer(onIdleTimeout);
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (total > 0) onProgress(Math.round((received / total) * 100));
          armIdleTimer(onIdleTimeout);
          file.write(chunk, (writeErr) => {
            if (writeErr && !errored) {
              errored = true;
              file.destroy();
              reject(writeErr);
            }
          });
        });
        res.on('end', () => {
          clearIdleTimer();
          if (!errored) file.end(() => resolve());
        });
        res.on('error', (err) => {
          clearIdleTimer();
          if (!errored) {
            errored = true;
            file.destroy();
            reject(err);
          }
        });
      },
    );
    req.on('error', (err) => {
      clearIdleTimer();
      reject(err);
    });
  });
}

// Resolves a path bundled inside the app's assets/ dir (used by the handful
// of "font-local" extras that aren't yet published on the "vsedi" release).
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
      const stamp = Date.now();
      const tmpScript = path.join(os.tmpdir(), `vsedi-ps-${stamp}.ps1`);
      const tmpLog = path.join(os.tmpdir(), `vsedi-ps-${stamp}.log`);
      // Wrap the command so all output is captured to a log file the parent can read.
      const wrappedCmd = `try { ${cmd} } catch { $_ | Out-File -LiteralPath '${tmpLog.replace(/'/g, "''")}' -Append; throw } *>> '${tmpLog.replace(/'/g, "''")}'`;
      try {
        fs.writeFileSync(tmpScript, wrappedCmd, 'utf8');
      } catch (err) {
        reject(err);
        return;
      }
      const cleanup = () => {
        for (const f of [tmpScript, tmpLog]) {
          try {
            fs.unlinkSync(f);
          } catch {
            /* ignore */
          }
        }
      };
      const elevateCmd = `try { $proc = Start-Process powershell -ArgumentList @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', '${tmpScript.replace(/'/g, "''")}') -Verb RunAs -Wait -PassThru -ErrorAction Stop; exit $proc.ExitCode } catch { $_.Exception.Message | Out-File -LiteralPath '${tmpLog.replace(/'/g, "''")}' -Append; exit 1 }`;
      installLog.info('Requesting PowerShell elevation (UAC)...');
      const ps = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        elevateCmd,
      ]);
      ps.on('close', (code) => {
        let ffLog = '';
        try {
          ffLog = fs.readFileSync(tmpLog, 'utf8').trim();
        } catch {
          /* no log */
        }
        cleanup();
        if (code === 0) {
          installLog.info('Elevated PowerShell completed successfully.');
          resolve();
        } else {
          installLog.error(
            `Elevated PowerShell failed (code ${code}).`,
            ffLog || '(no details)',
          );
          reject(
            new Error(
              ffLog || `PowerShell (elevated) exited with code ${code}`,
            ),
          );
        }
      });
      ps.on('error', (err) => {
        installLog.error('Failed to launch elevated PowerShell.', err);
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
      let output = '';
      ps.stdout.on('data', (d: Buffer) => {
        output += d.toString();
      });
      ps.stderr.on('data', (d: Buffer) => {
        output += d.toString();
      });
      ps.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          installLog.warn(
            `PowerShell failed (code ${code}), will retry elevated if applicable.`,
            output.trim() || '(no output)',
          );
          reject(
            new Error(output.trim() || `PowerShell exited with code ${code}`),
          );
        }
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
    const { code } = err as NodeJS.ErrnoException;
    if (code !== 'EACCES' && code !== 'EPERM') throw err;
    installLog.warn(
      `Write to "${filePath}" denied (${code}), retrying elevated...`,
    );
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
    const { code } = err as NodeJS.ErrnoException;
    if (code !== 'EACCES' && code !== 'EPERM') throw err;
    installLog.warn(
      `Create dir "${dir}" denied (${code}), retrying elevated...`,
    );
    const cmd = `New-Item -ItemType Directory -Force -LiteralPath '${dir.replace(/'/g, "''")}'`;
    await runPowerShell(cmd, true);
  }
}

// Opens a downloaded .ttf with its default handler (Windows' own font
// preview dialog), so the user installs it via the "Instalar" button. This
// hands the actual copy+registry work to Windows itself instead of a
// hand-rolled PowerShell Copy-Item, which was unreliable: Windows' font
// cache service briefly locks a font file right after it's registered, so a
// silent reinstall/update could silently no-op.
// Uses Start-Process -Wait (instead of shell.openPath) so this blocks until
// the user closes that window, keeping multiple font extras sequential
// instead of popping every preview window open at once.
async function installFont(fontPath: string): Promise<void> {
  installLog.info(`Opening font installer for "${path.basename(fontPath)}"...`);
  const cmd = `Start-Process -FilePath '${fontPath.replace(/'/g, "''")}' -Wait`;
  await runPowerShell(cmd);
}

function runSilentInstaller(exePath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    installLog.info(`Running installer "${path.basename(exePath)}"...`);
    const proc = spawn(exePath, args, { detached: false });
    proc.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        installLog.error(
          `Installer "${path.basename(exePath)}" exited with code ${code}.`,
        );
        reject(new Error(`Installer exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

export async function extractZip(
  zipPath: string,
  destPath: string,
): Promise<void> {
  // Scratch dir lives under the system Temp folder (not os.tmpdir(), which is
  // under the user profile) so its path never contains accented/non-ASCII
  // username characters — Windows PowerShell 5.1 (.NET Framework) can fail to
  // resolve such paths for cmdlets like Remove-Item on some machines.
  const systemTempDir = path.join(
    process.env.SystemRoot || 'C:\\Windows',
    'Temp',
  );
  const tmpDir = fs.mkdtempSync(path.join(systemTempDir, 'vsedi-'));
  const cmd = [
    `$tmp = '${tmpDir.replace(/'/g, "''")}'`,
    `$dest = '${destPath.replace(/'/g, "''")}'`,
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath $tmp -Force`,
    `$items = @(Get-ChildItem -LiteralPath $tmp)`,
    `$src = if ($items.Count -eq 1 -and $items[0].PSIsContainer) { $items[0].FullName } else { $tmp }`,
    `& robocopy $src $dest /E /IS /IT /IM /R:0 /W:0 | Out-Null`,
    `if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE. Cierra EuroScope y cualquier otro programa que use los archivos de sectores antes de instalar." }`,
    // Best-effort cleanup: a failure to delete this scratch dir must never
    // fail the whole install, since robocopy already finished the real work.
    `Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue`,
  ].join('; ');

  await runPowerShell(cmd).catch(() => runPowerShell(cmd, true));
  installLog.info(`Sector files copied to "${destPath}".`);
}

// Deletes a file, retrying elevated on permission errors.
async function deleteFileSafe(filePath: string): Promise<void> {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    const { code } = err as NodeJS.ErrnoException;
    if (code !== 'EACCES' && code !== 'EPERM') throw err;
    installLog.warn(
      `Delete "${filePath}" denied (${code}), retrying elevated...`,
    );
    const cmd = `Remove-Item -LiteralPath '${filePath.replace(/'/g, "''")}' -Force`;
    await runPowerShell(cmd, true);
  }
}

function formatBackupTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

const STALE_PRF_NAMES = new Set(['lecb.prf', 'lecm.prf', 'gccc.prf']);
const STALE_FILE_PREFIXES = ['lexx', 'lecm', 'lecb', 'gccc'];
const STALE_FILE_EXTENSIONS = new Set(['.sct', '.ese', '.rwy']);

function isStaleSectorFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  const ext = path.extname(lower);
  if (ext === '.prf') return STALE_PRF_NAMES.has(lower);
  if (STALE_FILE_EXTENSIONS.has(ext))
    return STALE_FILE_PREFIXES.some((p) => lower.startsWith(p));
  return false;
}

function findStaleSectorFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findStaleSectorFiles(full));
    else if (isStaleSectorFile(entry.name)) results.push(full);
  }
  return results;
}

// Zips the whole sectors folder into "VSEDI_Backup_<timestamp>.zip" inside that
// same folder, then deletes the stale per-sector files left over by previous
// installs (.prf for LECB/LECM/GCCC, and .sct/.ese/.rwy starting with
// LEXX/LECM/LECB/GCCC) so the new release doesn't end up next to outdated ones.
async function backupAndCleanSectorsFolder(folder: string): Promise<void> {
  const zipName = `VSEDI_Backup_${formatBackupTimestamp(new Date())}.zip`;
  const destZip = path.join(folder, zipName);
  const tmpZip = path.join(os.tmpdir(), `vsedi-backup-${Date.now()}.zip`);

  const cmd = [
    `$folder = '${folder.replace(/'/g, "''")}'`,
    `$tmpZip = '${tmpZip.replace(/'/g, "''")}'`,
    `$destZip = '${destZip.replace(/'/g, "''")}'`,
    // Exclude previous backups so they don't pile up inside each other
    `$items = @(Get-ChildItem -LiteralPath $folder -Force | Where-Object { $_.Name -notlike 'VSEDI_Backup_*.zip' })`,
    `if ($items.Count -eq 0) { Write-Output 'Carpeta vacía, omitiendo backup.'; exit 0 }`,
    `Compress-Archive -LiteralPath $items.FullName -DestinationPath $tmpZip -Force`,
    `Move-Item -LiteralPath $tmpZip -Destination $destZip -Force`,
  ].join('; ');

  installLog.info(`Creating backup zip "${zipName}"...`);
  await runPowerShell(cmd).catch(() => runPowerShell(cmd, true));

  const staleFiles = findStaleSectorFiles(folder);
  installLog.info(`Removing ${staleFiles.length} stale sector file(s).`);
  for (const filePath of staleFiles) {
    await deleteFileSafe(filePath);
  }
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
  const symbologyFiles = findSymbologyFiles(folder);
  installLog.info(`Found ${symbologyFiles.length} SIMBOLOGY.txt file(s).`);
  for (const filePath of symbologyFiles) {
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
  // Without both credentials there's nothing meaningful to inject, so leave
  // the .prf files exactly as they shipped instead of writing empty values.
  if (!cid.trim() || !password.trim()) {
    installLog.info('CID or password empty, skipping .prf patching.');
    return;
  }
  const prfFiles = findPrfFiles(folder);
  installLog.info(`Found ${prfFiles.length} .prf file(s) to patch.`);
  const rating = RATING_MAP[rank] ?? 1;
  const injected = [
    `LastSession\trealname\t${name}`,
    `LastSession\tcertificate\t${cid}`,
    `LastSession\tpassword\t${password}`,
    `LastSession\tserver\tAUTOMATIC`,
    `LastSession\trating\t${rating}`,
    `TeamSpeakVccs\tTs3NickName\t${`${name} - ${cid}`}`,
  ];
  const prefixes = injected.map((l) => l.split('\t').slice(0, 2).join('\t'));

  for (const prfPath of prfFiles) {
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
  if (!hoppieCode) return;
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
  installLog.info('Starting EuroScope installation...');
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
    installLog.info('EuroScope installation completed.');
    const detected = getDefaultEuroscopeExePath();
    if (detected) writeConfig({ euroscopePath: detected });
    return { success: true };
  } catch (err) {
    installLog.error('EuroScope installation failed.', (err as Error).message);
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
    backupAndCleanSectors,
    destFolder,
    name,
    cid,
    password,
    rank,
    hoppieCode,
    fontSize,
    betaPassword,
  } = payload;
  const send = (progress: InstallProgress) =>
    event.sender.send('install:progress', progress);

  if (isEuroscopeRunning()) {
    const msg =
      'EuroScope está abierto. Ciérralo antes de instalar los sectores para evitar errores o archivos corruptos.';
    installLog.warn(msg);
    return { success: false, error: msg };
  }

  let destIsDirectory = false;
  try {
    destIsDirectory =
      !!destFolder &&
      path.isAbsolute(destFolder) &&
      fs.statSync(destFolder).isDirectory();
  } catch {
    destIsDirectory = false;
  }
  if (!destIsDirectory) {
    const msg =
      'La carpeta de sectores no es válida. Selecciona una carpeta existente antes de instalar.';
    installLog.warn(msg);
    return { success: false, error: msg };
  }

  // Hidden BETA channel: same pipeline end to end, only the source package
  // differs (a separate, password-encrypted release asset).
  const isBeta = !!betaPassword;

  const tmpPath = path.join(
    os.tmpdir(),
    `vsedi-${overwriteSettings ? 'install' : 'update'}-${Date.now()}.zip`,
  );

  installLog.info(
    `Starting ${overwriteSettings ? 'installation' : 'update'} in "${destFolder}" (backupAndCleanSectors=${backupAndCleanSectors}${isBeta ? ', channel=BETA' : ''}).`,
  );

  try {
    // 1. Fetch release metadata
    send({ stage: 'fetching', percent: 0 });
    installLog.info(`Fetching ${isBeta ? 'BETA ' : ''}release from GitHub...`);
    const raw = await get(GITHUB_API);
    const release = JSON.parse(raw.toString()) as {
      assets: { name: string; browser_download_url: string }[];
    };

    const assetName = isBeta
      ? 'beta_install.zip.enc'
      : overwriteSettings
        ? 'data_install.zip'
        : 'data_update.zip';
    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset)
      throw new Error(`No se encontró el asset "${assetName}" en el release.`);

    // 2. Download (BETA assets land in a .enc temp file first, then get
    // decrypted into the same tmpPath the normal channel downloads straight
    // into — everything from here on is identical for both channels).
    send({ stage: 'downloading', percent: 0 });
    installLog.info(`Downloading "${assetName}"...`);
    const downloadDest = isBeta ? `${tmpPath}.enc` : tmpPath;
    await downloadWithProgress(
      asset.browser_download_url,
      downloadDest,
      (pct) => {
        send({ stage: 'downloading', percent: pct });
      },
    );

    if (isBeta) {
      installLog.info('Decrypting BETA package...');
      let decrypted: Buffer;
      try {
        decrypted = decryptBetaPackage(
          fs.readFileSync(downloadDest),
          betaPassword as string,
        );
      } catch {
        throw new Error('Contraseña BETA incorrecta.');
      } finally {
        try {
          fs.unlinkSync(downloadDest);
        } catch {
          /* ignore */
        }
      }
      fs.writeFileSync(tmpPath, decrypted);
    }

    // 3. Backup + clean stale sector files (opt-in, runs before extraction so
    // the backup captures the pre-update state). Best-effort: a failure here
    // (e.g. locked file, out of disk space) shouldn't abort the whole
    // install, since the actual sector update can still proceed fine without it.
    if (backupAndCleanSectors) {
      send({ stage: 'backup', percent: 0 });
      installLog.info('Running backup and cleaning stale sector files...');
      try {
        await backupAndCleanSectorsFolder(destFolder);
      } catch (backupErr) {
        installLog.warn(
          'Backup/cleanup of sectors folder failed, continuing install anyway.',
          (backupErr as Error).message,
        );
      }
      send({ stage: 'backup', percent: 100 });
    }

    // 4. Extract (retries elevated via UAC if destination is write-protected)
    send({ stage: 'extracting', percent: 0 });
    installLog.info(`Extracting package to "${destFolder}"...`);
    await extractZip(tmpPath, destFolder);

    // 5. Patch .prf files with user credentials (retries elevated on EACCES/EPERM)
    installLog.info('Applying credentials to .prf files...');
    await patchPrfFiles(destFolder, name, cid, password, rank, hoppieCode);
    installLog.info('Writing Hoppie configuration...');
    await createHoppieFiles(destFolder, hoppieCode);
    installLog.info(`Adjusting font size (${fontSize})...`);
    await patchSymbologyFontSize(destFolder, fontSize);

    // 6. Cleanup
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }

    // 7. Save user config
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

    // 8. Install selected extras (independently, failures don't abort the rest).
    // Mandatory extras are force-included here regardless of what the renderer
    // sent, so they always get installed even if the UI state was stale/wrong.
    const mandatoryExtraIds = EXTRAS.filter((e) => e.mandatory).map(
      (e) => e.id,
    );
    const extrasToInstall = Array.from(
      new Set([...payload.extras, ...mandatoryExtraIds]),
    );
    if (extrasToInstall.length > 0) {
      send({ stage: 'extras', percent: 0 });
      installLog.info(
        `Installing ${extrasToInstall.length} extra(s): ${extrasToInstall.join(', ')}`,
      );
      for (const extraId of extrasToInstall) {
        const extraConfig = EXTRAS.find((e) => e.id === extraId);
        if (!extraConfig) continue;

        send({ stage: 'extras', percent: 0, extraId, extraStatus: 'running' });
        installLog.info(
          `Starting extra "${extraConfig.name}" (${extraConfig.source})...`,
        );
        try {
          if (extraConfig.source === 'font') {
            // Fonts ship as assets on the same "vsedi" release the sector
            // data comes from, so reuse the release metadata already
            // fetched in step 1 instead of hitting the GitHub API again.
            const fontAsset = release.assets.find(
              (a) =>
                a.name.toLowerCase() === extraConfig.assetName.toLowerCase(),
            );
            if (!fontAsset)
              throw new Error(
                `No se encontró el asset "${extraConfig.assetName}" en el release.`,
              );
            const fontTmp = path.join(
              os.tmpdir(),
              `vsedi-extra-${extraConfig.id}${path.extname(extraConfig.assetName)}`,
            );
            await downloadWithProgress(
              fontAsset.browser_download_url,
              fontTmp,
              () => {},
            );
            try {
              await installFont(fontTmp);
            } finally {
              try {
                fs.unlinkSync(fontTmp);
              } catch {
                /* ignore */
              }
            }
          } else if (extraConfig.source === 'font-local') {
            await installFont(
              path.join(getAssetsPath(), extraConfig.assetPath),
            );
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
                installLog.info(
                  `Resolved "${extraConfig.name}" latest stable release: ${stable.tag_name}.`,
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
          installLog.info(`Extra "${extraId}" installed successfully.`);
          send({ stage: 'extras', percent: 100, extraId, extraStatus: 'done' });
        } catch (extraErr) {
          installLog.error(
            `Extra "${extraId}" failed.`,
            (extraErr as Error).message,
          );
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

    installLog.info('Installation completed successfully.');
    send({ stage: 'done', percent: 100 });
    return { success: true };
  } catch (err) {
    installLog.error('Installation failed.', (err as Error).message);
    return { success: false, error: (err as Error).message };
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}
