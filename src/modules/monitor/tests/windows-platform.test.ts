import { describe, expect, test } from "vitest"
import { PosixPlatform, selectPlatform, WindowsPlatform } from "#monitor/modules/monitor/adapters"

function runCommandThroughPowershell(): void {
  expect(new WindowsPlatform("pwsh.exe").shellInvocation("Get-Content -Wait app.log")).toEqual({
    file: "pwsh.exe",
    args: [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Console]::OutputEncoding = [Text.Encoding]::UTF8; Get-Content -Wait app.log",
    ],
    detached: false,
  })
}

function runCommandThroughPosixShell(): void {
  expect(new PosixPlatform().shellInvocation("tail -f app.log")).toEqual({
    file: "/bin/sh",
    args: ["-c", "tail -f app.log"],
    detached: true,
  })
}

function selectPosixOutsideWindows(): void {
  expect(selectPlatform("darwin")).toBeInstanceOf(PosixPlatform)
  expect(selectPlatform("linux")).toBeInstanceOf(PosixPlatform)
}

function refuseWindowsWithoutPowershell(): void {
  if (process.platform !== "win32") {
    expect(() => selectPlatform("win32")).toThrow("PowerShell was not found")
  }
}

function registerTests(): void {
  test("no Windows, roda o comando no PowerShell com saída UTF-8", runCommandThroughPowershell)
  test("fora do Windows, roda o comando no /bin/sh em grupo próprio", runCommandThroughPosixShell)
  test("escolhe a plataforma POSIX no macOS e no Linux", selectPosixOutsideWindows)
  test("recusa iniciar no Windows sem PowerShell disponível", refuseWindowsWithoutPowershell)
}

describe("plataforma de processos", registerTests)
