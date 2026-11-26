// 측정 스크립트(measure.mjs, measure-android.mjs)가 같이 쓰는 회선 조건과 순간 감시 코드다.
// watchMoment 는 브라우저 안에서 돈다(addInitScript). 바깥 변수를 쓰지 않는다.
// 회선 조건. fast4g가 "보통 4G"다(DevTools Fast 4G와 비슷하게 지연 70ms, 내려받기 9Mbps). CPU는 휴대폰을 흉내 내 4배 느리게 한다.
export const NETWORKS = {
  fast4g: { net: { offline: false, latency: 70, downloadThroughput: 9e6 / 8, uploadThroughput: 3e6 / 8 }, cpu: 4 },
  slow4g: {
    net: { offline: false, latency: 562.5, downloadThroughput: 1.47e6 / 8, uploadThroughput: 1.47e6 / 8 / 3 },
    cpu: 4,
  },
  none: { net: null, cpu: 1 },
};

export const MAP_MARKS = {
  sdkReady: 'jachwi:map-sdk-ready',
  mapCreated: 'jachwi:map-created',
  overlay: 'jachwi:map-overlay-attached',
};

export const watchMoment = ({ selector, text, mapTiming, marks }) => {
  const textPattern = text ? new RegExp(text) : null;
  const m = { at: null, what: null, lcp: null };
  window.__verify = m;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) m.lcp = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  if (mapTiming) {
    // 앱이 남기는 User Timing 표시만 읽는다. 지도 SDK 와 타일은 건드리지 않는다.
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === marks.sdkReady) m.sdkReady = entry.startTime;
        if (entry.name === marks.mapCreated) m.mapCreated = entry.startTime;
        if (entry.name === marks.overlay && m.at === null) {
          m.overlayAt = entry.startTime;
          m.at = entry.startTime;
          m.what = 'map overlay attached';
        }
      }
    }).observe({ type: 'mark', buffered: true });
    return;
  }
  const inView = (element) => {
    const r = element.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const check = () => {
    if (m.at !== null) return;
    for (const element of document.querySelectorAll(selector)) {
      if (!inView(element)) continue;
      if (textPattern && !textPattern.test(element.textContent ?? '')) continue;
      if (element instanceof HTMLImageElement && !(element.complete && element.naturalWidth > 0)) continue;
      m.at = -1;
      const decoded = element instanceof HTMLImageElement ? element.decode().catch(() => {}) : Promise.resolve();
      decoded.then(() =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            m.at = performance.now();
            m.what = element.outerHTML.slice(0, 120);
          }),
        ),
      );
      return;
    }
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true });
  document.addEventListener('load', check, true);
};

