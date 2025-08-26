// global.d.ts
export {};

declare global {
  interface Window {
    /** Google Tag (gtag.js) – GA4 이벤트 송신 함수 */
    gtag?: (...args: unknown[]) => void;

    /** GTM/GA4 공용 데이터 레이어 */
    dataLayer?: unknown[];
  }
}