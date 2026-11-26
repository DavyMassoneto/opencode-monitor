import { Effect, Schema, SchemaTransformation } from "effect"
import { compilePattern } from "./compile-pattern"

export const PATTERN_FROM_STRING = Schema.NonEmptyString.annotate({
  description:
    "JavaScript regular expression; only matching lines wake the agent. Omit to be woken by every line. Match failure states as well as success.",
}).pipe(
  Schema.decodeTo(
    Schema.RegExp,
    SchemaTransformation.transformEffect({
      decode: compilePattern,
      encode: (pattern) => Effect.succeed(pattern.source),
    }),
  ),
)
