/**
 * Bus de eventos de analytics.
 * Onda 1: buffer em memória + console. Onda 5: batch para `analytics_events`.
 * Nunca coletar sem consentimento LGPD (`analytics_consent` flag).
 */

export type AnalyticsEvent = {
  name: string;
  props?: Record<string, string | number | boolean | null>;
  userId?: string;
  timestamp: string;
};

const buffer: AnalyticsEvent[] = [];
let consented = false;

export function setAnalyticsConsent(value: boolean) {
  consented = value;
}

export function track(
  name: string,
  props?: AnalyticsEvent["props"],
  userId?: string,
) {
  if (!consented) return; // LGPD: no consent, no tracking
  const event: AnalyticsEvent = {
    name,
    props,
    userId,
    timestamp: new Date().toISOString(),
  };
  buffer.push(event);
  if (buffer.length > 1000) buffer.splice(0, buffer.length - 1000);
  if (typeof console !== "undefined") console.debug("[atlas-analytics]", event);
}

export function drainAnalytics(): AnalyticsEvent[] {
  return buffer.splice(0, buffer.length);
}
