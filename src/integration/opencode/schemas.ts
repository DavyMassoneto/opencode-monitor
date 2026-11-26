import { Schema } from "effect"

export const MONITOR_START_INPUT = Schema.Struct({
  command: Schema.NonEmptyString.annotate({ description: "Shell command; each line it prints to stdout is an event." }),
  description: Schema.NonEmptyString.annotate({ description: "Short label shown on each notification." }),
})
