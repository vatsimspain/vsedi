import type { StepProps, WizardStep } from '../models/wizard.types';
import StepIndicator from '../components/StepIndicator.component';
import UpdateBanner from '../components/UpdateBanner.component';
import WhiteLogo from '../../../assets/logo/WhiteLogo.png';
import Discord from '../../../assets/media/discord.png';
import Instagram from '../../../assets/media/ig.png';
import YouTube from '../../../assets/media/yt.png';
import X from '../../../assets/media/x.png';
import TikTok from '../../../assets/media/tik-tok.png';
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

  const version = require('../../../package.json').version || 'Local';

  return (
    <div
      className="relative flex flex-col h-screen"
      style={{
        backgroundImage: `url(${backgrounds[currentStep] ?? Bg1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <UpdateBanner />
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

      <div className="relative flex items-center justify-between flex-shrink-0 w-full p-2 text-xs ">
        <div className="flex items-center gap-2 ">
          <a
            href="https://dashboard.vatsimspain.es"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={Discord}
              alt="Discord Logo"
              className="w-8 hover:cursor-pointer hover:scale-105"
            />
          </a>
          <a
            href="https://www.instagram.com/vatsimspain/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={Instagram}
              alt="Instagram Logo"
              className="w-6 hover:cursor-pointer hover:scale-105"
            />
          </a>
          <a
            href="https://www.youtube.com/@vatsimspain"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={YouTube}
              alt="YouTube Logo"
              className="w-6 hover:cursor-pointer hover:scale-105"
            />
          </a>
          <a
            href="https://x.com/vatsimSpain"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={X}
              alt="X Logo"
              className="w-6 hover:cursor-pointer hover:scale-105"
            />
          </a>
          <a
            href="https://www.tiktok.com/@vatsimspain"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={TikTok}
              alt="TikTok Logo"
              className="w-6 hover:cursor-pointer hover:scale-105"
            />
          </a>
        </div>
        <p className="absolute -translate-x-1/2 left-1/2 text-slate-50">
          ©{' '}
          <a
            href="https://vatsimspain.es"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            VATSIM Spain 2026
          </a>{' '}
          - Hecho con ❤️ por el dept. de Web
        </p>
        <div className="flex flex-row items-end gap-1">
          <a
            href="mailto:operaciones@vatsimspain.es"
            className="text-white underline"
          >
            operaciones@vatsimspain.es
          </a>
          <p className="text-white">|</p>
          <p className="text-xs text-slate-400">
            v{version}
          </p>
        </div>
      </div>
    </div>
  );
}
