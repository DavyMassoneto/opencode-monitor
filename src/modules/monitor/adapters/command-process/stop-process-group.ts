import { STOP_SIGNAL } from "./constants"
import { isMissingProcessError } from "./predicates"

export function stopProcessGroup(pid: number): void {
  try {
    process.kill(-pid, STOP_SIGNAL)
  } catch (error) {
    if (!(error instanceof Error && isMissingProcessError(error))) {
      throw error
    }
  }
}
