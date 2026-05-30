import type { StepProps, WizardStep } from '../models/wizard.types';
import StepIndicator from '../components/StepIndicator.component';
import WhiteLogo from '../../../assets/logo/WhiteLogo.png';
import Bg1 from '../../../assets/bg/1.png';
import Bg2 from '../../../assets/bg/2.png';
import Bg3 from '../../../assets/bg/3.png';

const backgrounds = [Bg1, Bg2, Bg3];

type Props = {
  steps: WizardStep[];
  currentStep: number;
  stepProps: StepProps;
};

export default function WizardView({ steps, currentStep, stepProps }: Props) {
  const StepComponent = steps[currentStep].component;

  return (
    <div
      className="relative flex flex-col h-screen"
      style={{
        backgroundImage: `url(${backgrounds[currentStep] ?? Bg1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0 px-8 py-5 box-shadow-lg shadow-black/30">
          <img src={WhiteLogo} alt="VSEDI Logo" className="w-32" />
          <StepIndicator steps={steps} current={currentStep} />
        </div>

        <div
          className="flex-1 px-8 overflow-y-auto py-7 animate-fade-in"
          key={currentStep}
        >
          <StepComponent {...stepProps} />
        </div>
      </div>

      <div className="relative flex justify-center flex-shrink-0 w-full p-2 text-xs text-slate-50">
        <p>© VATSIM Spain 2026 - Hecho con ❤️ por Unai G.</p>
      </div>
    </div>
  );
}
