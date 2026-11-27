import { type MonitorLogger } from "#monitor/modules/monitor/public"

export class RecordingLogger implements MonitorLogger {
  readonly messages: string[] = []

  debug(message: string): void {
    this.messages.push(message)
  }
}
