import { Agent } from "@opencode/plugin"
import { Session } from "@opencode/schema/session"
import { SessionMessage } from "@opencode/schema/session-message"
import { Tool } from "@opencode/schema/tool"
import { Schema } from "effect"
import {
  HOST_AGENT,
  HOST_CALL_ID,
  HOST_DESCRIPTION,
  HOST_MESSAGE_ID,
  HOST_SESSION_ID,
  MONITOR_START_TOOL,
  PROBE_SIGNAL,
  SETTLE_MS,
} from "./constants"
import { type MonitorHostDouble } from "./monitor-host-double"
import { STARTED_TOOL_RESULT } from "./schemas"
import { type RegisteredTool, type ToolCallContext } from "./types"

export function toolCallContext(): ToolCallContext {
  return {
    sessionID: Schema.decodeSync(Session.ID)(HOST_SESSION_ID),
    agent: Schema.decodeSync(Agent.ID)(HOST_AGENT),
    messageID: Schema.decodeSync(SessionMessage.ID)(HOST_MESSAGE_ID),
    id: Schema.decodeSync(Tool.CallID)(HOST_CALL_ID),
    signal: new AbortController().signal,
    progress: async () => {},
  }
}

export function registeredTool(host: MonitorHostDouble, name: string): RegisteredTool {
  const tool = host.editor.get(name)

  if (!tool) {
    throw new Error(`tool not registered: ${name}`)
  }
  return tool
}

export async function startToolPid(host: MonitorHostDouble, command: string): Promise<number> {
  const result = await registeredTool(host, MONITOR_START_TOOL).execute(
    { command, description: HOST_DESCRIPTION },
    toolCallContext(),
  )

  return Schema.decodeUnknownSync(STARTED_TOOL_RESULT)(result.content).pid
}

export function isGroupAlive(pid: number): boolean {
  try {
    process.kill(-pid, PROBE_SIGNAL)
    return true
  } catch {
    return false
  }
}

export async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, SETTLE_MS))
}
