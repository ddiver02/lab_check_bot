export function pushDataLayer(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export function trackPageview(path: string) {
  pushDataLayer("page_view", {
    page_location: path,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  pushDataLayer(name, params);
}