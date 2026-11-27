import { spawnSync } from "node:child_process"
import { MISSING_POWERSHELL_TEXT, POWERSHELL_CANDIDATES, WHERE_PATH, WINDOWS_PLATFORM } from "./constants"
import { PosixPlatform } from "./posix-platform"
import { type ProcessPlatform } from "./types"
import { WindowsPlatform } from "./windows-platform"

export function selectPlatform(platform: NodeJS.Platform): ProcessPlatform {
  if (platform === WINDOWS_PLATFORM) {
    return new WindowsPlatform(availablePowershell())
  }
  return new PosixPlatform()
}

function availablePowershell(): string {
  const found = POWERSHELL_CANDIDATES.find((candidate) => spawnSync(WHERE_PATH, [candidate]).status === 0)

  if (!found) {
    throw new Error(MISSING_POWERSHELL_TEXT)
  }
  return found
}
