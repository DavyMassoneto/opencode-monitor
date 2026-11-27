import { Schema } from "effect"
import { MIN_LINE_MAX_BYTES } from "./constants"

export const POSITIVE_INTEGER = Schema.Int.check(Schema.isGreaterThan(0))

export const PLUGIN_OPTIONS = Schema.Struct({
  maxMonitorsPerSession: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  lineMaxBytes: Schema.Int.check(Schema.isGreaterThanOrEqualTo(MIN_LINE_MAX_BYTES)).pipe(Schema.optionalKey),
  batchMaxLines: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  pendingMaxLines: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  floodLinesPerSecond: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  floodSeconds: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  stderrMaxBytes: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  retentionDays: POSITIVE_INTEGER.pipe(Schema.optionalKey),
  debug: Schema.Boolean.pipe(Schema.optionalKey),
})
