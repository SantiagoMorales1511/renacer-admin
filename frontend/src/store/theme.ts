import { create } from 'zustand';

type Theme = 'light' | 'dark';

const KEY = 'renacer_theme';

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  init: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(KEY, next);
    apply(next);
    set({ theme: next });
  },
  init: () => {
    const stored = (localStorage.getItem(KEY) as Theme) ?? 'light';
    apply(stored);
    set({ theme: stored });
  },
}));
