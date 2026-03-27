export type TelemetryEvent = {
  name: string;
  payload?: Record<string, unknown>;
};

export function trackEvent(event: TelemetryEvent): void {
  if (process.env.NODE_ENV !== "production") {
    console.info("[telemetry]", event.name, event.payload ?? {});
  }
}
