import {
  type MonitorLifetime,
  type MonitorRequest,
  PERSISTENT_LIFETIME_KIND,
  TIMED_LIFETIME_KIND,
} from "#monitor/modules"
import { DEFAULT_TIMEOUT_MS } from "./constants"
import { type MonitorCallContext, type MonitorStartInput } from "./types"

export function monitorRequest(
  input: MonitorStartInput,
  context: MonitorCallContext,
  directory: string,
): MonitorRequest {
  const request: MonitorRequest = {
    sessionID: context.sessionID,
    command: input.command,
    description: input.description,
    directory,
    lifetime: lifetimeOf(input),
  }

  if (input.pattern) {
    request.pattern = input.pattern
  }
  return request
}

function lifetimeOf(input: MonitorStartInput): MonitorLifetime {
  if (input.persistent) {
    return { kind: PERSISTENT_LIFETIME_KIND }
  }
  if (input.timeout_ms) {
    return { kind: TIMED_LIFETIME_KIND, timeoutMs: input.timeout_ms }
  }
  return { kind: TIMED_LIFETIME_KIND, timeoutMs: DEFAULT_TIMEOUT_MS }
}
