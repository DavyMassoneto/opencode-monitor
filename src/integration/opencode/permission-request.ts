import { MONITOR_START_TOOL, PERMISSION_SOURCE_TYPE } from "./constants"
import { type MonitorCallContext, type MonitorStartInput, type PermissionRequest, type PermissionScope } from "./types"

export function permissionRequest(
  input: MonitorStartInput,
  context: MonitorCallContext,
  scope: PermissionScope,
): PermissionRequest {
  return {
    sessionID: context.sessionID,
    agent: context.agent,
    source: { type: PERMISSION_SOURCE_TYPE, messageID: context.messageID, id: context.id },
    action: scope.action,
    resources: scope.resources,
    save: scope.save,
    metadata: { tool: MONITOR_START_TOOL, description: input.description, command: input.command },
  }
}
