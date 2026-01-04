<script>
  import { Link } from 'svelte-routing';
  import { base, isMenuOpen } from './store.js';

  function toggleMenu() {
    isMenuOpen.update(n => !n);
  }
</script>

<header class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white sticky top-0 z-30 transition-colors duration-300">
  <div class="container mx-auto px-4 h-16 flex justify-between items-center">
    <div class="flex items-center space-x-2">
      <Link to={$base || "/"} class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:outline-none transition-colors" aria-label="홈으로 이동">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      </Link>
      <h1 class="text-xl font-extrabold tracking-tight">가족의 공간</h1>
    </div>
    
    <button 
      on:click={toggleMenu} 
      class="p-2 -mr-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:outline-none transition-colors"
      aria-label="메뉴 열기"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>
  </div>
</header>