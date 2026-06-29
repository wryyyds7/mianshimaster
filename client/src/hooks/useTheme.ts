import { useEffect } from 'react';
import { useConfigStore } from '../stores/configStore';

export function useTheme() {
  const theme = useConfigStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);
}
