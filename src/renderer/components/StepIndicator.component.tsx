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
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  active
                    ? 'bg-white text-zinc-900 shadow-lg shadow-white/10'
                    : done
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-600/50'
                      : 'bg-zinc-900 text-zinc-600 border border-zinc-700',
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
                  'mt-1.5 text-xs whitespace-nowrap',
                  active ? 'text-slate-200 font-medium' : 'text-slate-500',
                ].join(' ')}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={[
                  'h-px w-14 mx-2 mb-4 transition-all',
                  done ? 'bg-red-600/40' : 'bg-red-700',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
