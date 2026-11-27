export interface ShellInvocation {
  file: string
  args: string[]
  detached: boolean
}

export type StopStage = "terminate" | "kill"

export interface ProcessPlatform {
  shellInvocation(command: string): ShellInvocation
  readIdentity(pid: number): string
  hasTreeMembers(pid: number, identity: string): boolean
  stopTree(pid: number, identity: string, stage: StopStage): void
}

export interface StageSignals {
  terminate: NodeJS.Signals
  kill: NodeJS.Signals
}

export interface StageArguments {
  terminate: readonly string[]
  kill: readonly string[]
}
