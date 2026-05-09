type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackServerEvent(event: string, payload: AnalyticsPayload = {}) {
  console.info(
    JSON.stringify({
      source: 'server',
      event,
      payload,
      at: new Date().toISOString(),
    }),
  );
}
