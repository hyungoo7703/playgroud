<script>
  import { slide } from 'svelte/transition';

  // --- 1. 세액공제 계산 로직 (유지) ---
  let annualContribution = 6000000;
  let salaryCondition = 'low';
  const LIMIT = 6000000;

  $: taxRate = salaryCondition === 'low' ? 16.5 : 13.2;
  $: refundableAmount = Math.floor(Math.min(annualContribution, LIMIT) * (taxRate / 100));

  // --- 2. 복리 수익률 계산 로직 (유지) ---
  let monthlyInvest = 500000;
  let investYears = 20;
  let expectedRate = 8;
  
  let totalPrincipal = 0;
  let finalAsset = 0;
  let interestEarned = 0;

  function calculateROI() {
    let months = investYears * 12;
    let monthlyRate = expectedRate / 100 / 12;
    
    let current = 0;
    for (let i = 0; i < months; i++) {
      current = (current + monthlyInvest) * (1 + monthlyRate);
    }
    
    finalAsset = Math.floor(current);
    totalPrincipal = monthlyInvest * months;
    interestEarned = finalAsset - totalPrincipal;
  }

  $: {
    monthlyInvest, investYears, expectedRate;
    calculateROI();
  }

  // --- 3. 미국 주식 포트폴리오 데이터 (업그레이드 & 반말 버전) ---
  const products = [
    {
      category: "🔰 국룰 (기본템)",
      name: "미국 S&P500",
      code: "TIGER / ACE / SOL 360750 등",
      fee: "0.07% 수준",
      desc: "미국 1등부터 500등 기업 다 사는 거.",
      risk: "중간"
    },
    {
      category: "🚀 기술주 (상남자)",
      name: "미국 나스닥100",
      code: "ACE / TIGER 367380 등",
      fee: "0.07% 수준",
      desc: "애플, 구글, 테슬라... 세상을 바꾸는 기술 기업 100개에 몰빵.",
      risk: "높음"
    },
    {
      category: "🤖 AI 반도체 (트렌드)",
      name: "미국 필라델피아반도체",
      code: "TIGER 368590",
      fee: "0.49% 수준",
      desc: "엔비디아, TSMC 같은 반도체 대장들만 모은 거.",
      risk: "매우 높음"
    },
    {
      category: "💎 빅테크 Top7 (집중)",
      name: "미국 빅테크 TOP7",
      code: "SOL / ACE 465640",
      fee: "0.3% 수준",
      desc: "자잘한 거 다 빼고 애플, 마소, 엔비디아 같은 '7공주(Magnificent 7)'한테만 집중 투자.",
      risk: "매우 높음"
    },
    {
      category: "🛡️ 미국채 (방어용)",
      name: "미국 30년국채액티브",
      code: "ACE 452250",
      fee: "0.05% 수준",
      desc: "경제가 망할 거 같을 때 오르는 놈. 주식 다 떨어질 때 계좌 지켜주는 방패. 금리 인하하면 가격도 오름.",
      risk: "아주 낮음"
    }
  ];

  let activeTab = 'tax'; 
</script>

<div class="max-w-3xl mx-auto p-4 font-sans text-gray-800 dark:text-gray-100">
  
  <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
    <button 
      class="flex-1 py-3 text-center font-bold transition-all {activeTab === 'tax' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}"
      on:click={() => activeTab = 'tax'}>
      💰 세액공제
    </button>
    <button 
      class="flex-1 py-3 text-center font-bold transition-all {activeTab === 'roi' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}"
      on:click={() => activeTab = 'roi'}>
      📈 행복회로
    </button>
    <button 
      class="flex-1 py-3 text-center font-bold transition-all {activeTab === 'products' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}"
      on:click={() => activeTab = 'products'}>
      🏆 추천템
    </button>
  </div>

  {#if activeTab === 'tax'}
    <section in:slide class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4">내년 2월에 얼마 돌려받아?</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500">연봉 기준</label>
          <div class="flex space-x-4">
            <label class="flex items-center p-3 border rounded-lg cursor-pointer w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition {salaryCondition === 'low' ? 'border-blue-500 bg-blue-50 dark:bg-gray-700 ring-1 ring-blue-500' : 'border-gray-300'}">
              <input type="radio" bind:group={salaryCondition} value="low" class="mr-2 accent-blue-600">
              <span>5,500만원 이하 (16.5%)</span>
            </label>
            <label class="flex items-center p-3 border rounded-lg cursor-pointer w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition {salaryCondition === 'high' ? 'border-blue-500 bg-blue-50 dark:bg-gray-700 ring-1 ring-blue-500' : 'border-gray-300'}">
              <input type="radio" bind:group={salaryCondition} value="high" class="mr-2 accent-blue-600">
              <span>5,500만원 초과 (13.2%)</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500">올해 넣을 돈 (원)</label>
          <input 
            type="number" 
            bind:value={annualContribution} 
            step="100000"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-bold dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <p class="text-xs text-gray-400 mt-1">※ 한도는 600만원까지야!</p>
        </div>

        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
          <p class="text-sm text-gray-600 dark:text-gray-300">이만큼 꽁돈 생김</p>
          <p class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {refundableAmount.toLocaleString()}원
          </p>
          <p class="text-xs text-blue-500 mt-2 font-bold">
            수익률 {taxRate}% 먹고 들어가는 거임 ㅋㅋ
          </p>
        </div>
      </div>
    </section>
  {/if}

  {#if activeTab === 'roi'}
    <section in:slide class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4">복리의 마법 (행복회로 돌려보자)</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500">매월 투자금</label>
          <input type="number" bind:value={monthlyInvest} step="10000" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none"/>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500">얼마나 오래?</label>
          <input type="range" bind:value={investYears} min="1" max="40" class="w-full accent-green-600"/>
          <div class="text-right text-sm font-bold text-green-600">{investYears}년 존버</div>
        </div>
        <div class="col-span-1 md:col-span-2">
          <label class="block text-sm font-medium mb-1 text-gray-500">예상 수익률 (%)</label>
          <div class="flex items-center space-x-2">
            <input type="number" bind:value={expectedRate} step="0.5" class="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none"/>
            <span class="text-xs text-gray-400">보통 S&P500이 8~10% 정도 나옴</span>
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-3">
        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span class="text-gray-600 dark:text-gray-400">내가 넣은 쌩돈</span>
          <span class="font-bold">{totalPrincipal.toLocaleString()}원</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <span class="text-green-700 dark:text-green-400">돈이 벌어온 돈 (이자)</span>
          <span class="font-bold text-green-600">+{interestEarned.toLocaleString()}원</span>
        </div>
        <div class="mt-4 p-5 bg-gray-800 text-white rounded-xl text-center shadow-lg transform hover:scale-105 transition duration-200">
          <p class="text-sm opacity-80 mb-1">{investYears}년 뒤 내 자산 ㄷㄷ</p>
          <p class="text-3xl font-extrabold text-yellow-400">{finalAsset.toLocaleString()}원</p>
        </div>
      </div>
    </section>
  {/if}

  {#if activeTab === 'products'}
    <section in:slide class="space-y-4">
      <div class="grid gap-4">
        {#each products as item}
          <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:shadow-md transition-all">
            <div class="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
              <div>
                <div class="flex items-center space-x-2 mb-1">
                  <span class="px-2 py-1 text-xs font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {item.category}
                  </span>
                  <span class="text-xs text-red-500 font-medium">위험도: {item.risk}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>
              </div>
              <div class="text-left sm:text-right">
                <span class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">수수료 {item.fee}</span>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              {item.desc}
            </p>
            
            <div class="pt-3 border-t border-gray-100 dark:border-gray-700">
              <span class="text-xs font-mono text-gray-400">검색어: {item.code}</span>
            </div>
          </div>
        {/each}
      </div>
      
      <p class="text-xs text-center text-gray-400 mt-8">
        * 이거 투자 권유 아닌 거 알지? 투자는 본인 책임이야! (근데 이거 다 유명한 것들이긴 함)
      </p>
    </section>
  {/if}

</div>