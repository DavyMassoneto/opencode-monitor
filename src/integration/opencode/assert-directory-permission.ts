import { realpathSync } from "node:fs"
import { join } from "node:path"
import { ANY_DIRECTORY, EXTERNAL_DIRECTORY_PERMISSION } from "./constants"
import { permissionRequest } from "./permission-request"
import { isFilesystemRoot, isInsideDirectory } from "./predicates"
import { type MonitorCallContext, type MonitorHost, type MonitorStartInput } from "./types"

export async function assertDirectoryPermission(
  host: MonitorHost,
  directory: string,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<void> {
  const roots = [host.location.directory, host.location.project.directory]
    .filter((root) => !isFilesystemRoot(root))
    .map((root) => realpathSync(root))

  if (!roots.some((root) => isInsideDirectory(directory, root))) {
    const boundary = join(directory, ANY_DIRECTORY)
    const scope = { action: EXTERNAL_DIRECTORY_PERMISSION, resources: [boundary], save: [boundary] }
    await host.permission.assert(permissionRequest(input, context, scope))
  }
}
