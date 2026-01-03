<script>
  import { isMenuOpen } from './store.js';

  function toggleMenu() {
    isMenuOpen.update(n => !n);
  }
</script>

<header class="bg-blue-600 text-white shadow-md sticky top-0 z-20">
  <div class="container mx-auto px-4 py-3 flex justify-between items-center">
    <h1 class="text-xl font-bold">가족의 공간</h1>
    <button on:click={toggleMenu} class="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white">
      <!-- Hamburger Icon -->
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
      </svg>
    </button>
  </div>
</header>
