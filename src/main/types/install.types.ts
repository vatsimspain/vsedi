export interface InstallPayload {
  overwriteSettings: boolean;
  backupAndCleanSectors: boolean;
  destFolder: string;
  name: string;
  cid: string;
  password: string;
  rank: string;
  hoppieCode: string;
  fontSize: 'small' | 'medium' | 'large';
  extras: string[];
}

export interface SavedConfig {
  cid?: string;
  password?: string;
  name?: string;
  hoppieCode?: string;
  rank?: string;
  fontSize?: 'small' | 'medium' | 'large';
  sectorsFolder?: string;
  overwriteSettings?: boolean;
  backupAndCleanSectors?: boolean;
  euroscopePath?: string;
}

export interface InstallResult {
  success: boolean;
  error?: string;
}

export type InstallStage = 'fetching' | 'downloading' | 'backup' | 'extracting' | 'extras' | 'done';

export type ExtraInstallStatus = 'running' | 'done' | 'error';

export interface InstallProgress {
  stage: InstallStage;
  percent: number;
  extraId?: string;
  extraStatus?: ExtraInstallStatus;
  extraError?: string;
}
