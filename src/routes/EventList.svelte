<script>
  import { onMount } from 'svelte';

  let events = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // vite.config.js의 base 경로에 따라 public 폴더의 파일에 접근
      const response = await fetch('./data.json');
      if (!response.ok) {
        throw new Error('데이터를 불러오는 데 실패했습니다.');
      }
      const data = await response.json();
      events = data.events;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
  <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">가족 일정</h2>
  {#if loading}
    <p class="text-gray-500 dark:text-gray-400">데이터를 불러오는 중...</p>
  {:else if error}
    <p class="text-red-500">오류: {error}</p>
  {:else}
    <ul class="space-y-3">
      {#each events as event (event.id)}
        <li class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm flex justify-between items-center">
          <span class="font-semibold text-gray-700 dark:text-gray-200">{event.title}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{event.date}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
