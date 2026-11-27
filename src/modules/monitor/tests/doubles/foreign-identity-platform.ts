import { PosixPlatform } from "#monitor/modules/monitor/adapters"

export class ForeignIdentityPlatform extends PosixPlatform {
  private reads = 0

  readIdentity(pid: number): string {
    this.reads += 1
    if (this.reads === 1) {
      return `${pid} Mon Jan  1 00:00:00 2001`
    }
    return super.readIdentity(pid)
  }
}
