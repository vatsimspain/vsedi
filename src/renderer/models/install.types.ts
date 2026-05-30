export type InstallStage = 'fetching' | 'downloading' | 'extracting' | 'done';

export interface InstallProgress {
  stage: InstallStage;
  percent: number;
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
}
