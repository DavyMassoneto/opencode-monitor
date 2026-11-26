export interface AnalyzedCommand {
  kind: "analyzed"
  commands: string[]
}

export interface OpaqueCommand {
  kind: "opaque"
}

export type CommandAnalysis = AnalyzedCommand | OpaqueCommand

export interface ListState {
  terminator: string
  segment: string
  groups: number
  done: boolean
}
