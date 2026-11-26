import { Schema } from "effect"
import { PATTERN_FROM_STRING } from "./pattern-parsing"

export const MONITOR_START_INPUT = Schema.Struct({
  command: Schema.NonEmptyString.annotate({ description: "Shell command; each line it prints to stdout is an event." }),
  description: Schema.NonEmptyString.annotate({ description: "Short label shown on each notification." }),
  pattern: PATTERN_FROM_STRING.pipe(Schema.optionalKey),
})
