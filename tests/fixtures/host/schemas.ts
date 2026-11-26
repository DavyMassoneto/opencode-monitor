import { Session } from "@opencode/schema/session"
import { SessionInbox } from "@opencode/schema/session-inbox"
import { SessionMessage } from "@opencode/schema/session-message"
import { Schema } from "effect"

export const STARTED_SUMMARY = Schema.fromJsonString(
  Schema.Struct({
    id: Schema.String,
    pid: Schema.Number,
    status: Schema.String,
    startedAt: Schema.String,
    stderrPath: Schema.String,
    expiresAt: Schema.String.pipe(Schema.optionalKey),
  }),
)

export const SYNTHETIC_MESSAGE = Schema.Struct({
  sessionID: Session.ID,
  id: SessionMessage.ID.pipe(Schema.optional),
  text: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  metadata: SessionMessage.Synthetic.fields.metadata,
  delivery: SessionInbox.Delivery.pipe(Schema.optional),
  resume: Schema.Boolean.pipe(Schema.optional),
})
