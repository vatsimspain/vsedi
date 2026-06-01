export type InstallStage = 'fetching' | 'downloading' | 'extracting' | 'extras' | 'done';

export type ExtraInstallStatus = 'running' | 'done' | 'error';

export interface InstallProgress {
  stage: InstallStage;
  percent: number;
  extraId?: string;
  extraStatus?: ExtraInstallStatus;
  extraError?: string;
}

export interface InstallResult {
  success: boolean;
  error?: string;
}

export interface InstallPayload {
  overwriteSettings: boolean;
  destFolder: string;
  name: string;
  cid: string;
  password: string;
  rank: string;
  hoppieCode: string;
  fontSize: 'small' | 'medium' | 'large';
  extras: string[];
}
