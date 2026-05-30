import { useState, useEffect, useCallback } from 'react';
import type {
  InstallPayload,
  InstallProgress,
  InstallStage,
} from '../models/install.types';

export type InstallStatus = 'idle' | InstallStage | 'error';

interface InstallState {
  status: InstallStatus;
  progress: number;
  error: string | null;
}

const IDLE: InstallState = { status: 'idle', progress: 0, error: null };

export function useInstallation() {
  const [state, setState] = useState<InstallState>(IDLE);

  useEffect(() => {
    const remove = window.electron.ipcRenderer.on(
      'install:progress',
      (...args: unknown[]) => {
        const { stage, percent } = args[0] as InstallProgress;
        setState((s) => ({ ...s, status: stage, progress: percent }));
      },
    );
    return remove;
  }, []);

  const install = useCallback(async (payload: InstallPayload) => {
    setState({ status: 'fetching', progress: 0, error: null });

    const result = await window.electron.install.run(payload);

    if (!result.success) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: result.error ?? 'Error desconocido',
      }));
    }
  }, []);

  const reset = useCallback(() => setState(IDLE), []);

  return { ...state, install, reset };
}
