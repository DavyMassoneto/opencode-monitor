import { Schema } from "effect"
import { PATTERN_FROM_STRING } from "./pattern-parsing"

export const MONITOR_START_INPUT = Schema.Struct({
  command: Schema.NonEmptyString.annotate({ description: "Shell command; each line it prints to stdout is an event." }),
  description: Schema.NonEmptyString.annotate({ description: "Short label shown on each notification." }),
  pattern: PATTERN_FROM_STRING.pipe(Schema.optionalKey),
  timeout_ms: Schema.Int.check(Schema.isGreaterThan(0))
    .annotate({ description: "Milliseconds until the monitor ends with a final notice. Default 300000 (5 minutes)." })
    .pipe(Schema.optionalKey),
  delivery: Schema.Literals(["wake", "queue", "silent", "manual"])
    .annotate({
      description:
        "How notices arrive. wake (default): before the next model call, waking an idle session. queue: after the current work ends. silent: wait in the inbox until the session runs again. manual: no notices; read the lines with monitor_fetch.",
    })
    .pipe(Schema.optionalKey),
  persistent: Schema.Boolean.annotate({
    description: "Keep the monitor until monitor_stop or the end of the session; timeout_ms is ignored.",
  }).pipe(Schema.optionalKey),
})

export const MONITOR_LIST_INPUT = Schema.Struct({})

export const MONITOR_STOP_INPUT = Schema.Struct({
  id: Schema.NonEmptyString.annotate({ description: "Monitor id returned by monitor_start or monitor_list." }),
})

export const MONITOR_FETCH_INPUT = Schema.Struct({
  id: Schema.NonEmptyString.annotate({
    description: "Monitor id; omit to read the pending lines of every monitor.",
  }).pipe(Schema.optionalKey),
  peek: Schema.Boolean.annotate({ description: "Read the lines without removing them from the pending buffer." }).pipe(
    Schema.optionalKey,
  ),
})
