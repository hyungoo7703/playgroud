<script>
    import { onMount, onDestroy } from "svelte";
    import { fade, scale } from "svelte/transition";

    // Ramen Presets
    const RAMEN_PRESETS = [
        { name: "신라면", time: 270, color: "bg-red-600", text: "text-white" }, // 4:30
        {
            name: "진라면",
            time: 240,
            color: "bg-yellow-500",
            text: "text-gray-900",
        }, // 4:00
        {
            name: "짜파게티",
            time: 300,
            color: "bg-orange-800",
            text: "text-white",
        }, // 5:00
        {
            name: "컵라면 (일반)",
            time: 180,
            color: "bg-blue-500",
            text: "text-white",
        }, // 3:00
    ];

    let timeLeft = 0;
    let totalTime = 0;
    let timerInterval;
    let isRunning = false;
    let currentRamen = null;
    let isDone = false;

    function startTimer(preset) {
        clearInterval(timerInterval);
        currentRamen = preset;
        totalTime = preset.time;
        timeLeft = preset.time;
        isDone = false;
        isRunning = true;

        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                finishTimer();
            }
        }, 1000);
    }

    function pauseTimer() {
        isRunning = false;
        clearInterval(timerInterval);
    }

    function resumeTimer() {
        isRunning = true;
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                finishTimer();
            }
        }, 1000);
    }

    function resetTimer() {
        pauseTimer();
        timeLeft = 0;
        totalTime = 0;
        currentRamen = null;
        isDone = false;
    }

    function finishTimer() {
        pauseTimer();
        timeLeft = 0;
        isDone = true;
        if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]);
        // Optional: Play sound if we had one
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    onDestroy(() => {
        clearInterval(timerInterval);
    });
</script>

<div class="min-h-screen bg-orange-50 dark:bg-gray-900 p-6 pb-24">
    <div class="max-w-md mx-auto space-y-8">
        <header class="text-center space-y-2">
            <h2
                class="text-3xl font-black text-gray-900 dark:text-white tracking-tight"
            >
                🍜 라면 타이머
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
                꼬들면의 황금시간을 지켜드립니다
            </p>
        </header>

        <!-- Timer Display -->
        <div
            class="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-xl border border-orange-100 dark:border-gray-700 text-center relative overflow-hidden"
        >
            {#if isDone}
                <div
                    in:scale
                    class="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 z-10 backdrop-blur-sm p-4"
                >
                    <span class="text-6xl mb-4">🍽️</span>
                    <h3 class="text-3xl font-black text-white mb-2">
                        조리 끝!
                    </h3>
                    <p class="text-white font-bold opacity-90">
                        맛있게 드세요!
                    </p>
                    <button
                        on:click={resetTimer}
                        class="mt-6 px-8 py-3 bg-white text-green-600 font-black rounded-full shadow-lg text-lg"
                    >
                        확인
                    </button>
                </div>
            {/if}

            {#if currentRamen}
                <div class="mb-4">
                    <span
                        class="inline-block px-3 py-1 rounded-full text-xs font-bold {currentRamen.color} {currentRamen.text} shadow-sm"
                    >
                        {currentRamen.name}
                    </span>
                </div>
            {:else}
                <div class="h-8 mb-4"></div>
            {/if}

            <div
                class="font-mono text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter"
            >
                {formatTime(timeLeft)}
            </div>

            <!-- Controls -->
            {#if timeLeft > 0 || isDone}
                <div class="flex justify-center gap-3">
                    {#if isRunning}
                        <button
                            on:click={pauseTimer}
                            class="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-lg"
                        >
                            일시정지
                        </button>
                    {:else if currentRamen}
                        <button
                            on:click={resumeTimer}
                            class="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 dark:shadow-none"
                        >
                            계속
                        </button>
                        <button
                            on:click={resetTimer}
                            class="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold"
                        >
                            취소
                        </button>
                    {:else}
                        <p class="text-gray-400 text-sm font-medium">
                            라면을 선택해주세요 👇
                        </p>
                    {/if}
                </div>
            {:else}
                <div class="animate-pulse text-gray-400 text-sm font-medium">
                    아래에서 라면을 선택하세요
                </div>
            {/if}

            <!-- Progress Bar -->
            {#if totalTime > 0}
                <div
                    class="absolute bottom-0 left-0 h-2 bg-orange-500 transition-all duration-1000 ease-linear"
                    style="width: {(timeLeft / totalTime) * 100}%"
                ></div>
            {/if}
        </div>

        <!-- Presets Grid -->
        <div class="grid grid-cols-2 gap-3">
            {#each RAMEN_PRESETS as ramen}
                <button
                    on:click={() => startTimer(ramen)}
                    class="p-4 rounded-2xl border-2 border-transparent hover:border-orange-500 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-3 transition-all active:scale-95 text-left group"
                >
                    <div
                        class="w-10 h-10 rounded-full {ramen.color} flex items-center justify-center text-lg shadow-inner shrink-0"
                    >
                        🍜
                    </div>
                    <div>
                        <h4
                            class="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors"
                        >
                            {ramen.name}
                        </h4>
                        <p class="text-xs text-gray-400 font-mono">
                            {formatTime(ramen.time)}
                        </p>
                    </div>
                </button>
            {/each}
        </div>

        <!-- Custom Time -->
        <div
            class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center"
        >
            <p class="text-xs text-gray-500 mb-3">커스텀 시간 설정</p>
            <button
                on:click={() =>
                    startTimer({
                        name: "내 맘대로 1분",
                        time: 60,
                        color: "bg-gray-500",
                        text: "text-white",
                    })}
                class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 shadow-sm"
            >
                1:00 시작
            </button>
            <button
                on:click={() =>
                    startTimer({
                        name: "내 맘대로 2분",
                        time: 120,
                        color: "bg-gray-500",
                        text: "text-white",
                    })}
                class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 shadow-sm ml-2"
            >
                2:00 시작
            </button>
            <button
                on:click={() =>
                    startTimer({
                        name: "내 맘대로 2분 30초",
                        time: 150,
                        color: "bg-gray-500",
                        text: "text-white",
                    })}
                class="mt-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 shadow-sm ml-2"
            >
                2:30 시작
            </button>
            <button
                on:click={() =>
                    startTimer({
                        name: "내 맘대로 10분",
                        time: 600,
                        color: "bg-gray-500",
                        text: "text-white",
                    })}
                class="mt-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 shadow-sm ml-2"
            >
                10:00 시작
            </button>
        </div>
    </div>
</div>
