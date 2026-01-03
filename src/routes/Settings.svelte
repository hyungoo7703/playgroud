<script>
  import { isDarkMode } from '../lib/store.js';
</script>

<section id="settings" class="p-6 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
  <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">설정</h2>
  
  <div class="flex items-center justify-between">
    <span class="text-lg font-medium text-gray-700 dark:text-gray-300">다크 모드</span>
    <button 
      on:click={() => isDarkMode.set(!$isDarkMode)}
      class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors {$isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}"
    >
      <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform { $isDarkMode ? 'translate-x-6' : 'translate-x-1' }"></span>
    </button>
  </div>
</section>
