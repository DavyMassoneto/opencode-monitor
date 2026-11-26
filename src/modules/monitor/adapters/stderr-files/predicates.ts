import { SAFE_SESSION_ID } from "./constants"

export function isSafeSessionId(sessionID: string): boolean {
  return SAFE_SESSION_ID.test(sessionID)
}
