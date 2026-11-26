import { type StdioOptions } from "node:child_process"

export const SHELL_PATH = "/bin/sh"
export const SHELL_COMMAND_FLAG = "-c"
export const COMMAND_STDIO: StdioOptions = ["ignore", "pipe", "ignore"]
export const STOP_SIGNAL = "SIGTERM"
export const MISSING_PROCESS_CODE = "ESRCH"
export const PROCESS_ERROR_TEXT = "[opencode-monitor] command process error:"
export const LAUNCH_FAILURE_TEXT = "the command could not start: check the shell and the working directory"
