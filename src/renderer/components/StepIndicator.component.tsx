import type { WizardStep } from '../models/wizard.types';

export default function StepIndicator({
  steps,
  current,
}: {
  steps: WizardStep[];
  current: number;
}) {
  return (
    <nav className="flex items-start gap-0">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-white text-zinc-900 ring-4 ring-white/20'
                    : done
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                      : 'bg-zinc-800/60 text-zinc-500 ring-1 ring-zinc-700/50',
                ].join(' ')}
              >
                {done ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={[
                  'mt-1.5 text-xs whitespace-nowrap transition-colors duration-200',
                  active
                    ? 'text-white font-medium'
                    : done
                      ? 'text-emerald-400/70'
                      : 'text-zinc-600',
                ].join(' ')}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={[
                  'h-px w-14 mx-2 mb-4 transition-all duration-300',
                  done ? 'bg-emerald-500/40' : 'bg-zinc-700/50',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
