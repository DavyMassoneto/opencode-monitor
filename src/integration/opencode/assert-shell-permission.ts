import { CommandScanner, OPAQUE_KIND } from "./command-splitting"
import { ANY_DIRECTORY, EXTERNAL_DIRECTORY_PERMISSION, SHELL_PERMISSION } from "./constants"
import { permissionRequest } from "./permission-request"
import { type MonitorCallContext, type MonitorHost, type MonitorStartInput } from "./types"

export async function assertShellPermission(
  host: MonitorHost,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<void> {
  const analysis = new CommandScanner(input.command).analyze()

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
