import { REDACTED_SECRET, SECRET_PATTERNS } from "./constants"

export function redactSecrets(line: string): string {
  return SECRET_PATTERNS.reduce((redacted, pattern) => redacted.replace(pattern, REDACTED_SECRET), line)
}
