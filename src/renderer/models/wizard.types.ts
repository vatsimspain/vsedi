import type React from 'react';

export interface WizardFormData {
  cid: string;
  password: string;
  name: string;
  hoppieCode: string;
  rank: string;
  fontSize: 'small' | 'medium' | 'large';
  sectorsFolder: string;
  overwriteSettings: boolean;
}

export interface StepProps {
  formData: WizardFormData;
  setFormData: (data: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export interface WizardStep {
  id: string;
  title: string;
  component: React.FC<StepProps>;
}
