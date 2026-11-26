import { type RegisteredTool, type ToolDefinition, type ToolEditor } from "./types"

export class ToolEditorDouble implements ToolEditor {
  readonly tools: RegisteredTool[] = []

  list(): readonly RegisteredTool[] {
    return this.tools
  }

  get(id: string) {
    return this.tools.find((tool) => tool.id === id)
  }

  namespace(): void {}

  add(tool: ToolDefinition): void {
    this.tools.push({ ...tool, id: tool.name })
  }

  update(): void {}

  remove(): void {}
}
