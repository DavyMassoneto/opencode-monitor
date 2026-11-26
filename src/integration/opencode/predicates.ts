import { dirname, isAbsolute, relative } from "node:path"
import { PARENT_SEGMENT } from "./constants"

export function isInsideDirectory(directory: string, root: string): boolean {
  const path = relative(root, directory)

  return path === "" || (!path.startsWith(PARENT_SEGMENT) && !isAbsolute(path))
}

export function isFilesystemRoot(directory: string): boolean {
  return dirname(directory) === directory
}
