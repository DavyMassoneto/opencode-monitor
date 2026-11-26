import { type ToolTransformCallback } from "#monitor/integration"
import { type STARTED_SUMMARY } from "./schemas"

export type ToolEditor = Parameters<ToolTransformCallback>[0]

export type ToolDefinition = Parameters<ToolEditor["add"]>[0]

export type RegisteredTool = ReturnType<ToolEditor["list"]>[number]

export type ToolCallContext = Parameters<RegisteredTool["execute"]>[1]

export type WakeSubscriber = () => void

export type StartedToolResult = typeof STARTED_SUMMARY.Type

export interface StartOverrides {
  timeout_ms?: number
  persistent?: boolean
}
