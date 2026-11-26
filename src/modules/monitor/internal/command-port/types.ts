import { type EnvironmentVariables } from "#monitor/modules/monitor/public/contracts"

export interface CommandRequest {
  command: string
  directory: string
  environment: EnvironmentVariables
}

export interface CodeExit {
  kind: "code"
  code: number
}

export interface SignalExit {
  kind: "signal"
  signal: string
}

export type CommandExit = CodeExit | SignalExit

export type LineHandler = (line: string) => void

export type ExitHandler = (exit: CommandExit) => void

export interface CommandHandlers {
  onLine: LineHandler
  onStderr: LineHandler
  onExit: ExitHandler
}

export type StopCommand = () => void

export interface LaunchedCommand {
  kind: "launched"
  pid: number
  stop: StopCommand
}

export interface CommandLaunchFailed {
  kind: "failed"
  reason: string
}

export type CommandLaunch = LaunchedCommand | CommandLaunchFailed

export type CommandLauncher = (request: CommandRequest, handlers: CommandHandlers) => CommandLaunch
