import { type ToolTransformCallback } from "#monitor/integration"

export type ToolEditor = Parameters<ToolTransformCallback>[0]

export type ToolDefinition = Parameters<ToolEditor["add"]>[0]

export type RegisteredTool = ReturnType<ToolEditor["list"]>[number]

export type ToolCallContext = Parameters<RegisteredTool["execute"]>[1]
