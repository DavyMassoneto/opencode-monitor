import { type FetchRequest, MONITOR_NOT_FOUND_KIND, type Monitors } from "#monitor/modules"
import { FETCH_NOT_FOUND_TEXT } from "./constants"
import { type MonitorCallContext, type MonitorFetchInput, type MonitorToolResult } from "./types"

export function fetchLines(
  monitors: Monitors,
  input: MonitorFetchInput,
  context: MonitorCallContext,
): MonitorToolResult {
  const request: FetchRequest = { sessionID: context.sessionID, peek: input.peek === true }

  if (input.id) {
    request.id = input.id
  }
  const fetched = monitors.fetch(request)
  if (fetched.kind === MONITOR_NOT_FOUND_KIND) {
    throw new Error(`${FETCH_NOT_FOUND_TEXT}${fetched.id}`)
  }
  return { content: JSON.stringify(fetched.monitors) }
}
