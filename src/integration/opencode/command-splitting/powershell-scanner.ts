import { CommandScanner } from "./command-scanner"
import { OPAQUE_KIND, POWERSHELL_DYNAMIC_COMMAND } from "./constants"
import { type CommandAnalysis } from "./types"

export function analyzePowershell(command: string): CommandAnalysis {
  if (POWERSHELL_DYNAMIC_COMMAND.test(command)) {
    return { kind: OPAQUE_KIND }
  }
  return new CommandScanner(command).analyze()
}
