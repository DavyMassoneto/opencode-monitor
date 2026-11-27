import { type StdioOptions } from "node:child_process"

export const COMMAND_STDIO: StdioOptions = ["ignore", "pipe", "pipe"]
export const KILL_DELAY_MS = 3000
export const PROCESS_ERROR_TEXT = "[opencode-monitor] command process error:"
export const LAUNCH_FAILURE_TEXT = "the command could not start: check the shell and the working directory"
