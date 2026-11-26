import { Schema } from "effect"
import { ENVIRONMENT_NAME_PATTERN, MAX_STDERR_LINES } from "./input-limits"
import { PATTERN_FROM_STRING } from "./pattern-parsing"

export const ENVIRONMENT_VARIABLES = Schema.Record(Schema.String, Schema.String).check(
  Schema.makeFilter((variables) => Object.keys(variables).every((name) => ENVIRONMENT_NAME_PATTERN.test(name)), {
    expected: "variable names made of letters, digits and _ that do not start with a digit",
  }),
)

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
  capture_stderr: Schema.Boolean.annotate({
    description:
      "Also turn stderr lines into events, prefixed with 'stderr: '. stderr is always written to a file; read its last lines with monitor_fetch stderr_lines.",
  }).pipe(Schema.optionalKey),
  cwd: Schema.NonEmptyString.annotate({
    description: "Working directory, absolute or relative to the session directory. Default: the session directory.",
  }).pipe(Schema.optionalKey),
  env: ENVIRONMENT_VARIABLES.annotate({ description: "Extra environment variables for the command." }).pipe(
    Schema.optionalKey,
  ),
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
  stderr_lines: Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(MAX_STDERR_LINES))
    .annotate({ description: "Also return the last N lines of each monitor's stderr file, up to 1000." })
    .pipe(Schema.optionalKey),
})
