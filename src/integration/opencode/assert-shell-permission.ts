import { CommandScanner, OPAQUE_KIND } from "./command-splitting"
import {
  ANY_DIRECTORY,
  EXTERNAL_DIRECTORY_PERMISSION,
  MONITOR_START_TOOL,
  PERMISSION_SOURCE_TYPE,
  SHELL_PERMISSION,
} from "./constants"
import { type MonitorCallContext, type MonitorHost, type MonitorStartInput, type PermissionRequest } from "./types"

export async function assertShellPermission(
  host: MonitorHost,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<void> {
  const analysis = new CommandScanner(input.command).analyze()

  if (analysis.kind === OPAQUE_KIND) {
    await host.permission.assert(permissionRequest(input, context, SHELL_PERMISSION, [input.command], []))
    await host.permission.assert(permissionRequest(input, context, EXTERNAL_DIRECTORY_PERMISSION, [ANY_DIRECTORY], []))
  } else {
    const resources = analysis.commands.length > 0 ? analysis.commands : [input.command]
    await host.permission.assert(permissionRequest(input, context, SHELL_PERMISSION, resources, resources))
  }
}

function permissionRequest(
  input: MonitorStartInput,
  context: MonitorCallContext,
  action: string,
  resources: string[],
  save: string[],
): PermissionRequest {
  return {
    sessionID: context.sessionID,
    agent: context.agent,
    source: { type: PERMISSION_SOURCE_TYPE, messageID: context.messageID, id: context.id },
    action,
    resources,
    save,
    metadata: { tool: MONITOR_START_TOOL, description: input.description, command: input.command },
  }
}
