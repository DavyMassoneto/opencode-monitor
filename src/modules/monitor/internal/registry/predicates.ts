import { type PendingLines } from "#monitor/modules/monitor/public/contracts"

export function hasContent(pending: PendingLines): boolean {
  return pending.lines.length > 0 || pending.dropped > 0 || Boolean(pending.stderr?.length)
}
