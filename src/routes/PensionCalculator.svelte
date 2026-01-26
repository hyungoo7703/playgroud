<script>
  import { slide } from "svelte/transition";

  // --- 1. 세액공제 계산 로직 (유지) ---
  let annualContribution = 6000000;
  let salaryCondition = "low";
  const LIMIT = 6000000;

  $: taxRate = salaryCondition === "low" ? 16.5 : 13.2;
  $: refundableAmount = Math.floor(
    Math.min(annualContribution, LIMIT) * (taxRate / 100),
  );

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

  // --- 3. 추천 포트폴리오 (전문적인 용어 사용) ---
  const products = [
    {
      category: "📈 시장 지수 (기본)",
      name: "미국 S&P500",
      code: "TIGER / ACE / SOL 미국S&P500",
      fee: "0.07% 내외",
      desc: "미국 상위 500개 우량 기업에 분산 투자하는 상품입니다. 장기 투자의 정석으로 불립니다.",
      risk: "중위험",
    },
    {
      category: "🛡️ 안전 자산 (채권)",
      name: "미국 30년 국채",
      code: "ACE / TIGER 미국30년국채액티브(H)",
      fee: "0.05% 내외",
      desc: "미국 정부가 보증하는 장기 채권입니다. 주식 시장 하락 시 방어 역할을 하며, 금리 인하 시 자본 차익을 기대할 수 있습니다.",
      risk: "저위험",
    },
    {
      category: "🇰🇷 국내 배당 (인프라)",
      name: "맥쿼리인프라",
      code: "088980",
      fee: "운용보수 상이",
      desc: "국내의 도로, 항만 등 인프라 자산에 투자하여 통행료 수익 등을 배당으로 지급하는 대표적인 고배당주입니다.",
      risk: "중위험",
    },
  ];

  let activeTab = "tax";
</script>

<div class="max-w-3xl mx-auto p-4 font-sans text-gray-800 dark:text-gray-100">
  <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
    <button
      class="flex-1 py-3 text-center font-bold transition-all {activeTab ===
      'tax'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-400 hover:text-gray-600'}"
      on:click={() => (activeTab = "tax")}
    >
      💰 세액공제 계산
    </button>
    <button
      class="flex-1 py-3 text-center font-bold transition-all {activeTab ===
      'roi'
        ? 'text-green-600 border-b-2 border-green-600'
        : 'text-gray-400 hover:text-gray-600'}"
      on:click={() => (activeTab = "roi")}
    >
      📈 예상 수익률
    </button>
    <button
      class="flex-1 py-3 text-center font-bold transition-all {activeTab ===
      'products'
        ? 'text-purple-600 border-b-2 border-purple-600'
        : 'text-gray-400 hover:text-gray-600'}"
      on:click={() => (activeTab = "products")}
    >
      🏆 추천 포트폴리오
    </button>
  </div>

  {#if activeTab === "tax"}
    <section
      in:slide
      class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 class="text-xl font-bold mb-4">연말정산 예상 환급액</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500"
            >연봉 기준</label
          >
          <div class="flex space-x-4">
            <label
              class="flex items-center p-3 border rounded-lg cursor-pointer w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition {salaryCondition ===
              'low'
                ? 'border-blue-500 bg-blue-50 dark:bg-gray-700 ring-1 ring-blue-500'
                : 'border-gray-300'}"
            >
              <input
                type="radio"
                bind:group={salaryCondition}
                value="low"
                class="mr-2 accent-blue-600"
              />
              <span>5,500만원 이하 (16.5%)</span>
            </label>
            <label
              class="flex items-center p-3 border rounded-lg cursor-pointer w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition {salaryCondition ===
              'high'
                ? 'border-blue-500 bg-blue-50 dark:bg-gray-700 ring-1 ring-blue-500'
                : 'border-gray-300'}"
            >
              <input
                type="radio"
                bind:group={salaryCondition}
                value="high"
                class="mr-2 accent-blue-600"
              />
              <span>5,500만원 초과 (13.2%)</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500"
            >연간 납입 금액 (원)</label
          >
          <input
            type="number"
            bind:value={annualContribution}
            step="100000"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-bold dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <p class="text-xs text-gray-400 mt-1">
            ※ 연금저축 한도는 연 600만원입니다.
          </p>
        </div>

        <div
          class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center"
        >
          <p class="text-sm text-gray-600 dark:text-gray-300">예상 공제 금액</p>
          <p
            class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1"
          >
            {refundableAmount.toLocaleString()}원
          </p>
          <p class="text-xs text-blue-500 mt-2 font-bold">
            확정 수익률 {taxRate}% 효과
          </p>
        </div>
      </div>
    </section>
  {/if}

  {#if activeTab === "roi"}
    <section
      in:slide
      class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 class="text-xl font-bold mb-4">복리 수익 시뮬레이션</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500"
            >월 투자금</label
          >
          <input
            type="number"
            bind:value={monthlyInvest}
            step="10000"
            class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-500"
            >투자 기간</label
          >
          <input
            type="range"
            bind:value={investYears}
            min="1"
            max="40"
            class="w-full accent-green-600"
          />
          <div class="text-right text-sm font-bold text-green-600">
            {investYears}년
          </div>
        </div>
        <div class="col-span-1 md:col-span-2">
          <label class="block text-sm font-medium mb-1 text-gray-500"
            >예상 연평균 수익률 (%)</label
          >
          <div class="flex items-center space-x-2">
            <input
              type="number"
              bind:value={expectedRate}
              step="0.5"
              class="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <span class="text-xs text-gray-400"
              >S&P500의 과거 평균 수익률은 약 8~10%입니다.</span
            >
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-3">
        <div
          class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <span class="text-gray-600 dark:text-gray-400">총 투자 원금</span>
          <span class="font-bold">{totalPrincipal.toLocaleString()}원</span>
        </div>
        <div
          class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800"
        >
          <span class="text-green-700 dark:text-green-400">예상 투자 수익</span>
          <span class="font-bold text-green-600"
            >+{interestEarned.toLocaleString()}원</span
          >
        </div>
        <div
          class="mt-4 p-5 bg-gray-800 text-white rounded-xl text-center shadow-lg"
        >
          <p class="text-sm opacity-80 mb-1">{investYears}년 후 예상 자산</p>
          <p class="text-3xl font-extrabold text-yellow-400">
            {finalAsset.toLocaleString()}원
          </p>
        </div>
      </div>
    </section>
  {/if}

  {#if activeTab === "products"}
    <section in:slide class="space-y-4">
      <div class="grid gap-4">
        {#each products as item}
          <div
            class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:shadow-md transition-all"
          >
            <div
              class="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2"
            >
              <div>
                <div class="flex items-center space-x-2 mb-1">
                  <span
                    class="px-2 py-1 text-xs font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {item.category}
                  </span>
                  <span class="text-xs text-red-500 font-medium"
                    >위험도: {item.risk}</span
                  >
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {item.name}
                </h3>
              </div>
              <div class="text-left sm:text-right">
                <span
                  class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded"
                  >수수료 {item.fee}</span
                >
              </div>
            </div>

            <p
              class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3"
            >
              {item.desc}
            </p>

            <div class="pt-3 border-t border-gray-100 dark:border-gray-700">
              <span class="text-xs font-mono text-gray-400"
                >종목코드: {item.code}</span
              >
            </div>
          </div>
        {/each}
      </div>

      <p class="text-xs text-center text-gray-400 mt-8">
        * 본 자료는 투자 참고용이며, 투자에 대한 책임은 본인에게 있습니다.
      </p>
    </section>
  {/if}
</div>
