import { useState, useEffect } from 'react';
import type { WizardFormData, WizardStep } from '../models/wizard.types';

const DEFAULT_FORM: WizardFormData = {
  cid: '',
  password: '',
  name: '',
  hoppieCode: '',
  rank: '',
  fontSize: 'medium',
  sectorsFolder: '',
  overwriteSettings: false,
  extras: [],
};

export function useWizardController(steps: WizardStep[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormDataState] = useState<WizardFormData>(DEFAULT_FORM);

  useEffect(() => {
    window.electron.config.load().then((saved) => {
      const s = saved as Partial<WizardFormData>;
      setFormDataState((prev) => ({
        ...prev,
        ...(s.cid != null && { cid: s.cid }),
        ...(s.password != null && { password: s.password }),
        ...(s.name != null && { name: s.name }),
        ...(s.hoppieCode != null && { hoppieCode: s.hoppieCode }),
        ...(s.rank != null && { rank: s.rank }),
        ...(s.fontSize != null && { fontSize: s.fontSize }),
        ...(s.sectorsFolder != null && { sectorsFolder: s.sectorsFolder }),
        ...(s.overwriteSettings != null && { overwriteSettings: s.overwriteSettings }),
      }));
    }).catch(() => {});
  }, []);

  const setFormData = (partial: Partial<WizardFormData>) =>
    setFormDataState((prev) => ({ ...prev, ...partial }));

  const goNext = () => {
    setCurrentStep((s) => {
      const next = Math.min(s + 1, steps.length - 1);
      // Save form data when advancing from the config step (index 1)
      if (s === 1) {
        window.electron.config.save(formData as unknown as Record<string, unknown>).catch(() => {});
      }
      return next;
    });
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return { currentStep, formData, setFormData, goNext, goBack };
}
