<script>
  import { Link, useLocation } from 'svelte-routing';
  import { isMenuOpen } from './store.js';

  const location = useLocation();

  function closeMenu() {
    isMenuOpen.set(false);
  }

  // 메뉴 아이템에 아이콘 SVG 데이터 추가
  const menuItems = [
    { 
      path: '/', 
      title: '홈',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>'
    },
    { 
      path: '/events', 
      title: '가족 일정',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>'
    },
    { 
      path: '/bulletin-board',
      title: '가족 게시판',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>'
    },
    { 
      path: '/ledger',
      title: '장부',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
    },
    { 
      path: '/pension-calculator', 
      title: '연금저축 계산기',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>'
    },
    { 
      path: '/food-spinner', 
      title: '오늘 뭐 먹지?',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>' // 시계 아이콘 대체 (적절한 아이콘으로 변경 가능)
    },
    { 
      path: '/settings', 
      title: '설정',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>'
    }
  ];
</script>

{#if $isMenuOpen}
  <div
    class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
    on:click={closeMenu}
    aria-hidden="true"
  ></div>
{/if}

<aside 
  class="fixed top-0 left-0 max-w-xs w-full h-full bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-all duration-300 ease-in-out {$isMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
>
  <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">메뉴</h2>
    <button on:click={closeMenu} class="p-2 -mr-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:outline-none">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  </div>

  <nav class="px-4 py-6 overflow-y-auto h-[calc(100%-80px)]">
    <ul class="space-y-2 font-medium">
      {#each menuItems as item}
        <li>
          <Link 
            to={item.path}
            on:click={closeMenu}
            class="flex items-center w-full p-3 rounded-xl transition-all duration-200 group
              {$location.pathname === item.path
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}"
          >
            <svg 
              class="flex-shrink-0 w-6 h-6 mr-4 transition-colors
                {$location.pathname === item.path ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
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