import type { WizardFormData } from '../models/wizard.types';

export function useConfigController(
  setFormData: (partial: Partial<WizardFormData>) => void,
) {
  const pickSectorsFolder = async () => {
    const folder = await window.electron.dialog.openFolder();
    if (folder) setFormData({ sectorsFolder: folder });
  };

  return { pickSectorsFolder };
}
