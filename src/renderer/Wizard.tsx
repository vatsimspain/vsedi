import { useTranslation } from 'react-i18next';
import type { WizardStep } from './models/wizard.types';
import { useWizardController } from './controllers/WizardController.controller';
import WizardView from './views/WizardView';
import WelcomeStepView from './views/steps/WelcomeStepView';
import ChangelogStepView from './views/steps/ChangelogStepView';
import EuroscopeStepView from './views/steps/EuroscopeStepView';
import ConfigStepView from './views/steps/ConfigStepView';
import ExtrasStepView from './views/steps/ExtrasStepView';
import ProgressStepView from './views/steps/ProgressStepView';
import FinalStepView from './views/steps/FinalStepView';

export default function Wizard() {
  const { t } = useTranslation();

  const STEPS: WizardStep[] = [
    { id: 'welcome', title: t('steps.welcome'), component: WelcomeStepView },
    { id: 'changelog', title: t('steps.changelog'), component: ChangelogStepView },
    { id: 'euroscope', title: t('steps.euroscope'), component: EuroscopeStepView },
    { id: 'config', title: t('steps.config'), component: ConfigStepView },
    { id: 'extras', title: t('steps.extras'), component: ExtrasStepView },
    { id: 'install', title: t('steps.install'), component: ProgressStepView },
    { id: 'final', title: t('steps.final'), component: FinalStepView },
  ];

  const { currentStep, formData, setFormData, goNext, goBack } =
    useWizardController(STEPS);

  return (
    <WizardView
      steps={STEPS}
      currentStep={currentStep}
      stepProps={{
        formData,
        setFormData,
        onNext: goNext,
        onBack: goBack,
        isFirst: currentStep === 0,
        isLast: currentStep === STEPS.length - 1,
      }}
    />
  );
}
