import { analyzePowershell, type CommandAnalysis, CommandScanner, OPAQUE_KIND } from "./command-splitting"
import { ANY_DIRECTORY, EXTERNAL_DIRECTORY_PERMISSION, SHELL_PERMISSION, WINDOWS_PLATFORM } from "./constants"
import { permissionRequest } from "./permission-request"
import { type MonitorCallContext, type MonitorHost, type MonitorStartInput } from "./types"

export async function assertShellPermission(
  host: MonitorHost,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<void> {
  const analysis = analyzeCommand(input.command, process.platform)

  if (analysis.kind === OPAQUE_KIND) {
    const whole = { action: SHELL_PERMISSION, resources: [input.command], save: [] }
    const anyDirectory = { action: EXTERNAL_DIRECTORY_PERMISSION, resources: [ANY_DIRECTORY], save: [] }
    await host.permission.assert(permissionRequest(input, context, whole))
    await host.permission.assert(permissionRequest(input, context, anyDirectory))
  } else {
    const resources = analysis.commands.length > 0 ? analysis.commands : [input.command]
    await host.permission.assert(
      permissionRequest(input, context, { action: SHELL_PERMISSION, resources, save: resources }),
    )
  }
}

export function analyzeCommand(command: string, platform: NodeJS.Platform): CommandAnalysis {
  if (platform === WINDOWS_PLATFORM) {
    return analyzePowershell(command)
  }
  return new CommandScanner(command).analyze()
}
