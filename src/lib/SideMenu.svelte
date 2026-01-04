<script>
  import { Link, useLocation } from 'svelte-routing';
  import { base, isMenuOpen } from './store.js';

  const location = useLocation();

  function closeMenu() {
    isMenuOpen.set(false);
  }

  const menuItems = [
    { path: '/', title: '홈', icon: '...' },
    { path: '/events', title: '가족 일정', icon: '...' },
    { path: '/bulletin-board', title: '가족 게시판', icon: '...' },
    { path: '/ledger', title: '장부', icon: '...' },
    { path: '/pension-calculator', title: '연금저축 계산기', icon: '...' },
    { path: '/food-spinner', title: '오늘 뭐 먹지?', icon: '...' },
    { path: '/settings', title: '설정', icon: '...' }
  ];

  // 하위 경로(/playground)를 포함한 실제 URL을 생성하는 헬퍼 함수
  $: getFullPath = (path) => {
    if (path === '/') return base || '/';
    return `${base}${path}`;
  };

  // 현재 경로와 메뉴 경로가 일치하는지 확인 (끝의 '/' 제거하여 비교 정확도 향상)
  $: isActive = (path) => {
    const currentPath = $location.pathname.replace(/\/$/, '');
    const targetPath = getFullPath(path).replace(/\/$/, '');
    return currentPath === targetPath || (path === '/' && currentPath === base);
  };
</script>

<aside class="...">
  <nav class="px-4 py-6 overflow-y-auto h-[calc(100%-80px)]">
    <ul class="space-y-2 font-medium">
      {#each menuItems as item}
        <li>
          <Link 
            to={getFullPath(item.path)} 
            on:click={closeMenu}
            class="flex items-center w-full p-3 rounded-xl transition-all duration-200 group
              {isActive(item.path)
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}"
          >
            <svg 
              class="flex-shrink-0 w-6 h-6 mr-4 transition-colors
                {isActive(item.path) ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              {@html item.icon}
            </svg>
            <span class="flex-1 text-left">{item.title}</span>
          </Link>
        </li>
      {/each}
    </ul>
  </nav>
</aside>