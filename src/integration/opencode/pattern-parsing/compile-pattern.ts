import { Effect, type SchemaAST, SchemaIssue } from "effect"
import { INVALID_PATTERN_ISSUE } from "./constants"

export function compilePattern(
  source: string,
  options: SchemaAST.ParseOptions,
): Effect.Effect<RegExp, SchemaIssue.Issue> {
  try {
    return Effect.succeed(new RegExp(source))
  } catch {
    return Effect.fail(new SchemaIssue.InvalidValue(INVALID_PATTERN_ISSUE, source, options))
  }
}
