import { type StageArguments, type StageSignals } from "./types"

export const TERMINATE_STAGE = "terminate"
export const KILL_STAGE = "kill"
export const POSIX_SHELL = "/bin/sh"
export const POSIX_COMMAND_FLAG = "-c"
export const POSIX_STAGE_SIGNALS: StageSignals = { terminate: "SIGTERM", kill: "SIGKILL" }
export const PS_PATH = "ps"
export const PS_FORMAT = "pgid=,lstart="
export const PROBE_SIGNAL = 0
export const GONE_PROCESS_CODES: readonly string[] = ["ESRCH", "EPERM"]
export const WINDOWS_PLATFORM = "win32"
export const POWERSHELL_CANDIDATES: readonly string[] = ["pwsh.exe", "powershell.exe"]
export const POWERSHELL_COMMAND_ARGS: readonly string[] = ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command"]
export const WHERE_PATH = "where.exe"
export const TASKKILL_PATH = "taskkill.exe"
export const TASKKILL_STAGE_ARGS: StageArguments = { terminate: ["/T", "/F"], kill: ["/T", "/F"] }
export const UTF8_PREAMBLE = "[Console]::OutputEncoding = [Text.Encoding]::UTF8; "
export const IDENTITY_QUERY_OPENING = '(Get-CimInstance Win32_Process -Filter "ProcessId='
export const IDENTITY_QUERY_CLOSING = '").CreationDate.ToUniversalTime().ToString("o")'
export const TREE_QUERY_OPENING = 'if (Get-CimInstance Win32_Process -Filter "ProcessId='
export const TREE_QUERY_MIDDLE = " OR ParentProcessId="
export const TREE_QUERY_CLOSING = '") { "alive" }'
export const ALIVE_OUTPUT = "alive"
export const TEXT_ENCODING = "utf8"
export const MISSING_POWERSHELL_TEXT =
  "PowerShell was not found: install PowerShell 7 (pwsh.exe) or enable Windows PowerShell (powershell.exe)"
export const TREE_SCRIPT_OPENING =
  "$all = Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,CreationDate; $since = [datetime]::Parse('"
export const TREE_SCRIPT_MIDDLE = "').ToUniversalTime(); $ids = @("
export const TREE_SCRIPT_CLOSING =
  "); $found = @(); do { $next = @($all | Where-Object { $ids -contains $_.ParentProcessId -and $found.ProcessId -notcontains $_.ProcessId -and $_.CreationDate.ToUniversalTime() -ge $since }); $found += $next; $ids = @($next.ProcessId) } while ($next.Count); $found | ForEach-Object { $_.ProcessId }"
export const LINE_SEPARATOR = /\s+/
