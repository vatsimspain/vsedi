import { useState, useEffect, useCallback } from 'react';
import type {
  InstallPayload,
  InstallProgress,
  InstallStage,
  ExtraInstallStatus,
} from '../models/install.types';

export type InstallStatus = 'idle' | InstallStage | 'error';
export type ExtrasProgress = Record<string, ExtraInstallStatus>;

interface InstallState {
  status: InstallStatus;
  progress: number;
  error: string | null;
  extrasProgress: ExtrasProgress;
}

const IDLE: InstallState = {
  status: 'idle',
  progress: 0,
  error: null,
  extrasProgress: {},
};

export function useInstallation() {
  const [state, setState] = useState<InstallState>(IDLE);

  useEffect(() => {
    const remove = window.electron.ipcRenderer.on(
      'install:progress',
      (...args: unknown[]) => {
        const { stage, percent, extraId, extraStatus } =
          args[0] as InstallProgress;
        setState((s) => {
          const next: InstallState = { ...s, status: stage, progress: percent };
          if (stage === 'extras' && extraId && extraStatus) {
            next.extrasProgress = { ...s.extrasProgress, [extraId]: extraStatus };
          }
          return next;
        });
      },
    );
    return remove;
  }, []);

  const install = useCallback(async (payload: InstallPayload) => {
    setState({ status: 'fetching', progress: 0, error: null, extrasProgress: {} });

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
