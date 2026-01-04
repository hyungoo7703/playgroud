// sw.js
self.addEventListener("activate", (event) => {
  // 활성화되자마자 현재 열려있는 모든 탭(클라이언트)을 제어함
  event.waitUntil(clients.claim());
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // 1. GAS 요청은 서비스 워커가 개입하지 않도록 즉시 리턴 (가장 중요)
  // respondWith를 호출하지 않으면 브라우저가 직접 네트워크 요청을 보냅니다.
  if (url.includes("script.google.com")) {
    return;
  }

  // 2. 그 외 정적 파일들 처리
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 정상 응답이면 그대로 반환
        if (response) return response;
        // 응답이 없으면 에러 응답 생성
        return new Response("No response found", { status: 404 });
      })
      .catch((error) => {
        console.error("Fetch failed in SW:", error);
        // 3. 에러 발생 시에도 반드시 'Response' 객체를 반환해야 에러가 안 납니다.
        return new Response("Network error occurred", {
          status: 408,
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});
