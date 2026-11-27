import { join } from "node:path"
import { Schema } from "effect"
import { type MonitorLimits, type MonitorSettings } from "#monitor/modules"
import {
  DEBUG_ENABLED_VALUES,
  DEBUG_ENVIRONMENT_VARIABLE,
  DEBUG_LOG_NAME,
  DEFAULT_LIMITS,
  MS_PER_DAY,
} from "./constants"
import { FileDebugLogger } from "./file-debug-logger"
import { PLUGIN_OPTIONS } from "./schemas"
import { type EnvironmentReader, type HostOptions } from "./types"

export function resolveSettings(
  options: HostOptions,
  readEnvironment: EnvironmentReader,
  stderrRoot: string,
): MonitorSettings {
  const { debug, retentionDays, ...overrides } = Schema.decodeUnknownSync(PLUGIN_OPTIONS)(options, {
    onExcessProperty: "error",
  })
  const limits: MonitorLimits = { ...DEFAULT_LIMITS, ...overrides }
  const debugByEnvironment = DEBUG_ENABLED_VALUES.includes(String(readEnvironment(DEBUG_ENVIRONMENT_VARIABLE)))

  if (retentionDays) {
    limits.retentionMs = retentionDays * MS_PER_DAY
  }
  return {
    stderrRoot,
    limits,
    logger: new FileDebugLogger(join(stderrRoot, DEBUG_LOG_NAME), debug === true || debugByEnvironment),
  }
}
