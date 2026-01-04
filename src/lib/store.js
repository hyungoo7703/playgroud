import { writable } from 'svelte/store';

// 메뉴 상태 관리
export const isMenuOpen = writable(false);

// 다크 모드 관리
const createDarkModeStore = () => {
  let initialValue = false;
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem('isDarkMode');
    if (fromStorage) {
      initialValue = fromStorage === 'true';
    } else {
      initialValue = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  const { subscribe, set, update } = writable(initialValue);

  if (typeof window !== 'undefined') {
    // 테마 초기 적용
    document.documentElement.classList.toggle('dark', initialValue);
  }

  return {
    subscribe,
    set: (value) => {
      if (typeof window !== 'undefined') {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('isDarkMode', String(value));
      }
      set(value);
    },
    update,
  };
};

export const isDarkMode = createDarkModeStore();
