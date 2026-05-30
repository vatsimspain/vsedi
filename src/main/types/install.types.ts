export interface InstallPayload {
  overwriteSettings: boolean;
  destFolder: string;
  name: string;
  cid: string;
  password: string;
  rank: string;
  hoppieCode: string;
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
  installedAiracs?: Record<string, string>;
}

export interface InstallResult {
  success: boolean;
  error?: string;
}

export type InstallStage = 'fetching' | 'downloading' | 'extracting' | 'done';

export interface InstallProgress {
  stage: InstallStage;
  percent: number;
}
