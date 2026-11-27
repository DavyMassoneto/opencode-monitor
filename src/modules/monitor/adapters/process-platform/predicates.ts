import { GONE_PROCESS_CODES } from "./constants"

export function isGoneProcessError(error: Error): boolean {
  return "code" in error && typeof error.code === "string" && GONE_PROCESS_CODES.includes(error.code)
}
