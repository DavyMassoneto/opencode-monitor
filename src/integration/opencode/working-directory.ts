import { existsSync, realpathSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { MISSING_DIRECTORY_TEXT } from "./constants"
import { type MonitorLocationHost, type MonitorStartInput } from "./types"

export function workingDirectory(location: MonitorLocationHost, input: MonitorStartInput): string {
  const requested = requestedDirectory(location, input)

  if (!existsSync(requested) || !statSync(requested).isDirectory()) {
    throw new Error(`${MISSING_DIRECTORY_TEXT}${requested}`)
  }
  return realpathSync(requested)
}

function requestedDirectory(location: MonitorLocationHost, input: MonitorStartInput): string {
  if (input.cwd) {
    return resolve(location.directory, input.cwd)
  }
  return location.directory
}
