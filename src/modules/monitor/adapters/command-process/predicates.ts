import { MISSING_PROCESS_CODE } from "./constants"

export function isMissingProcessError(error: Error): boolean {
  return "code" in error && error.code === MISSING_PROCESS_CODE
}
