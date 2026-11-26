import { type CommandExit, EXIT_CODE_KIND } from "../command-port"
import { EXIT_CODE_TEXT, EXIT_SIGNAL_TEXT } from "./constants"

export function exitLine(exit: CommandExit): string {
  if (exit.kind === EXIT_CODE_KIND) {
    return `${EXIT_CODE_TEXT}${exit.code}`
  }
  return `${EXIT_SIGNAL_TEXT}${exit.signal}`
}
