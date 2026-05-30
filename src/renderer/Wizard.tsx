import type { WizardStep } from './models/wizard.types';
import { useWizardController } from './controllers/WizardController.controller';
import WizardView from './views/WizardView';
import WelcomeStepView from './views/steps/WelcomeStepView';
import ConfigStepView from './views/steps/ConfigStepView';
import ProgressStepView from './views/steps/ProgressStepView';

const STEPS: WizardStep[] = [
  { id: 'welcome', title: 'Bienvenida', component: WelcomeStepView },
  { id: 'config', title: 'Configuración', component: ConfigStepView },
  { id: 'extras', title: 'Extras', component: ProgressStepView },
  { id: 'install', title: 'Instalación', component: ProgressStepView },
];

export default function Wizard() {
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
