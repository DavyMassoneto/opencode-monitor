import { LEADING_PREFIX } from "./constants"
import { isClosingKeyword } from "./predicates"

export function normalizeCommand(segment: string): string {
  let command = segment.trim()
  let previous = ""

  while (command !== previous) {
    previous = command
    command = command.replace(LEADING_PREFIX, "").trim()
  }
  if (isClosingKeyword(command)) {
    return ""
  }
  return command
}
