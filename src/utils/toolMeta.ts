export function buildMeta(toolName: string, startTime: number) {
  return {
    toolName,
    toolVersion: "1.0.0",
    latencyMs: Date.now() - startTime,
  };
}
