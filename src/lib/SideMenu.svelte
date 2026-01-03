<script>
  import { isMenuOpen, currentPage } from './store.js';

  function closeMenu() {
    isMenuOpen.set(false);
  }

  function navigateTo(page) {
    currentPage.set(page);
    closeMenu();
  }

  const menuItems = [
    { id: 'home', title: '홈' },
    { id: 'events', title: '가족 일정' },
    { id: 'pension-calculator', title: '연금저축펀드 계산기' },
    { id: 'settings', title: '설정' }
  ];
</script>

{#if $isMenuOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
    on:click={closeMenu}
  ></div>

  <aside class="fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-transform { $isMenuOpen ? 'translate-x-0' : '-translate-x-full' }">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">메뉴</h2>
    </div>
    <nav class="mt-4">
      <ul>
        {#each menuItems as item}
          <li>
            <button on:click={() => navigateTo(item.id)} class="w-full text-left block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              {item.title}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>
{/if}
