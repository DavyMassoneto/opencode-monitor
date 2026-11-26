import { type Plugin } from "@opencode/plugin"
import { type MONITOR_START_INPUT, type MONITOR_STOP_INPUT } from "./schemas"

export type MonitorStartInput = typeof MONITOR_START_INPUT.Type

export type MonitorStopInput = typeof MONITOR_STOP_INPUT.Type

export type ToolTransformCallback = Parameters<Plugin.Context["tool"]["transform"]>[0]

export type PermissionRequest = Parameters<Plugin.Context["permission"]["assert"]>[0]

export type SyntheticMessage = Parameters<Plugin.Context["session"]["synthetic"]>[0]

export type SyntheticDelivery = NonNullable<SyntheticMessage["delivery"]>

export type ToolRegistration = Awaited<ReturnType<Plugin.Context["tool"]["transform"]>>

export interface SyntheticAdmission {
  id: string
}

export interface MonitorToolHost {
  transform(callback: ToolTransformCallback): Promise<ToolRegistration>
}

export interface MonitorPermissionHost {
  assert(request: PermissionRequest): Promise<void>
}

export interface MonitorSessionHost {
  synthetic(message: SyntheticMessage): Promise<SyntheticAdmission>
}

export interface MonitorLocationHost {
  directory: string
}

export type SessionDeletedType = "session.deleted"

export interface SessionDeletedSubscription {
  types: SessionDeletedType[]
  signal: AbortSignal
}

export interface DeletedSessionData {
  sessionID: string
}

export interface SessionDeletedEvent {
  data: DeletedSessionData
}

export interface MonitorEventHost {
  subscribe(options: SessionDeletedSubscription): AsyncIterable<SessionDeletedEvent>
}

export interface MonitorHost {
  tool: MonitorToolHost
  permission: MonitorPermissionHost
  session: MonitorSessionHost
  location: MonitorLocationHost
  event: MonitorEventHost
}

export interface MonitorCallContext {
  sessionID: string
  agent: string
  messageID: string
  id: string
}

export interface MonitorToolResult {
  content: string
}

export interface MonitorPattern {
  pattern?: RegExp
}
