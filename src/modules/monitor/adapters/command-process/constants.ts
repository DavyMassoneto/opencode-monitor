import { type StdioOptions } from "node:child_process"

export const SHELL_PATH = "/bin/sh"
export const SHELL_COMMAND_FLAG = "-c"
export const COMMAND_STDIO: StdioOptions = ["ignore", "pipe", "pipe"]
export const STOP_SIGNAL: NodeJS.Signals = "SIGTERM"
export const KILL_SIGNAL: NodeJS.Signals = "SIGKILL"
export const KILL_DELAY_MS = 3000
export const GONE_PROCESS_CODES: readonly string[] = ["ESRCH", "EPERM"]
export const PROCESS_ERROR_TEXT = "[opencode-monitor] command process error:"
export const LAUNCH_FAILURE_TEXT = "the command could not start: check the shell and the working directory"
