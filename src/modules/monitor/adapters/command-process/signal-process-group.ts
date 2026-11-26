import { isGoneProcessError } from "./predicates"

export function signalProcessGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
  } catch (error) {
    if (!(error instanceof Error && isGoneProcessError(error))) {
      throw error
    }
  }
}
