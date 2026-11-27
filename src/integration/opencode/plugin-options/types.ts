import { type Plugin } from "@opencode/plugin"

export type HostOptions = Plugin.Context["options"]

export type EnvironmentValue = NodeJS.ProcessEnv[string]

export type EnvironmentReader = (name: string) => EnvironmentValue
