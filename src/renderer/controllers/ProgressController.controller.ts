import { useEffect, useState } from 'react';

export const TASKS = [
  'Instalando LECM, LECB y GCCC',
  'Instalando fuente vSACTA',
  'Instalando vATIS',
  'Instalando Track Audio',
];

const TOTAL_MS = 5000;
const STEP_MS = TOTAL_MS / TASKS.length;

export function useProgressController() {
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgress(pct);
      setCompletedCount(Math.min(Math.floor(elapsed / STEP_MS), TASKS.length));

      if (elapsed >= TOTAL_MS) {
        clearInterval(tick);
        setProgress(100);
        setCompletedCount(TASKS.length);
        setDone(true);
      }
    }, 50);

    return () => clearInterval(tick);
  }, []);

  return { progress, completedCount, done, tasks: TASKS };
}
