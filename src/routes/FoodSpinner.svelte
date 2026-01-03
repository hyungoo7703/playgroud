<script>
  import { onMount } from 'svelte';

  const foodList = [
    '코지하우스 🍝',      // 파스타, 스테이크가 메인인 캐주얼 양식당
    '코다리명가 🐟',      // 매콤한 코다리 조림
    '힘찬숯불유황오리 🦆',  // 몸보신에 최고인 오리 구이
    '명성가 🥘',         // 코다리와 아구찜 등 찜 요리 전문
    '파파시아 🍤',       // 팟타이, 나시고랭 등 아시안 푸드
    '심비디움 🍣',       // 프리미엄 스시 뷔페
    '애슐리 🍕',         // 피자, 치킨 등 다양한 월드 뷔페
    '샤브20 🍲',        // 무제한 샤브샤브
    '대궐막국수 🥢',       // 시원한 막국수와 수육
    '버거킹 🍔'
  ];

  let spinning = false;
  let result = '오늘 뭐 먹지?';
  let spinInterval;
  let spinDuration = 3000; // 3초 동안 스핀
  let spinSpeed = 75; // 75ms 간격으로 텍스트 변경

  function startSpin() {
    if (spinning) return;
    
    spinning = true;
    let startTime = Date.now();

    spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * foodList.length);
      result = foodList[randomIndex];
    }, spinSpeed);

    setTimeout(() => {
      clearInterval(spinInterval);
      const finalIndex = Math.floor(Math.random() * foodList.length);
      result = `🎉 ${foodList[finalIndex]} 🎉`;
      spinning = false;
    }, spinDuration);
  }

  onMount(() => {
    // 컴포넌트가 파괴될 때 interval을 정리
    return () => {
      if (spinInterval) {
        clearInterval(spinInterval);
      }
    };
  });
</script>

<section id="food-spinner" class="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg text-center">
  <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">오늘 뭐 먹지? 돌림판</h2>
  
  <div class="my-8 p-8 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner">
    <p class="text-4xl font-extrabold text-blue-600 dark:text-blue-400 h-16 flex items-center justify-center transition-all duration-100">
      {result}
    </p>
  </div>

  <button 
    on:click={startSpin}
    disabled={spinning}
    class="w-full py-4 px-6 text-xl font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
  >
    {spinning ? '돌아가는 중...' : '돌려!'}
  </button>
</section>
