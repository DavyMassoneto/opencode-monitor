import { randomUUID } from "node:crypto"
import { AssertInput } from "@opencode/plugin/permission"
import { Schema } from "effect"
import {
  type HostOptions,
  type MonitorHost,
  type MonitorLocationHost,
  type MonitorPermissionHost,
  type MonitorSessionHost,
  type MonitorToolHost,
  type PermissionRequest,
  type SyntheticMessage,
  type ToolTransformCallback,
} from "#monitor/integration"
import { HOST_SESSION_PREFIX, PERMISSION_DENIED_TEXT } from "./constants"
import { SYNTHETIC_MESSAGE } from "./schemas"
import { SessionEventsDouble } from "./session-events-double"
import { ToolEditorDouble } from "./tool-editor-double"

export class MonitorHostDouble implements MonitorHost {
  readonly options: HostOptions = {}
  readonly sessionID = `${HOST_SESSION_PREFIX}${randomUUID().replaceAll("-", "")}`
  readonly editor = new ToolEditorDouble()
  readonly permissionRequests: PermissionRequest[] = []
  readonly messages: SyntheticMessage[] = []
  denyPermission = false
  readonly deniedResources: RegExp[] = []

  readonly tool: MonitorToolHost = {
    transform: async (callback: ToolTransformCallback) => {
      callback(this.editor)
      return { dispose: async () => {} }
    },
  }

  readonly permission: MonitorPermissionHost = {
    assert: async (request: PermissionRequest) => {
      Schema.decodeUnknownSync(AssertInput)(request)
      this.permissionRequests.push(request)
      const isDenied = request.resources.some((resource) => this.deniedResources.some((rule) => rule.test(resource)))
      if (this.denyPermission || isDenied) {
        throw new Error(PERMISSION_DENIED_TEXT)
      }
    },
  }

  readonly session: MonitorSessionHost = {
    synthetic: async (message: SyntheticMessage) => {
      const admitted = Schema.decodeUnknownSync(SYNTHETIC_MESSAGE)(message)
      this.messages.push(message)
      return { id: String(admitted.id) }
    },
  }

  readonly location: MonitorLocationHost = { directory: process.cwd(), project: { directory: process.cwd() } }

  readonly event = new SessionEventsDouble()
}
