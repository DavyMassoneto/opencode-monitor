import { describe, expect, test } from "vitest"
import { analyzeCommand, type CommandAnalysis } from "#monitor/integration"

function analyze(command: string): CommandAnalysis {
  return analyzeCommand(command, "win32")
}

function splitPipeline(): void {
  expect(analyze("Get-Content -Wait app.log | Select-String -Pattern 'ERROR|READY'")).toEqual({
    kind: "analyzed",
    commands: ["Get-Content -Wait app.log", "Select-String -Pattern 'ERROR|READY'"],
  })
}

function splitStatements(): void {
  expect(analyze("Write-Output 'ok'; Remove-Item -Recurse C:\\temp\\x")).toEqual({
    kind: "analyzed",
    commands: ["Write-Output 'ok'", "Remove-Item -Recurse C:\\temp\\x"],
  })
}

function extractSubexpression(): void {
  expect(analyze('Write-Output "$(Remove-Item x)"')).toEqual({
    kind: "analyzed",
    commands: ["Remove-Item x", 'Write-Output "$(Remove-Item x)"'],
  })
}

function rejectScriptBlocks(): void {
  for (const command of [
    "& { Remove-Item x }",
    ". { Remove-Item x }",
    "Get-Content log | % { $_ }",
    "if ($true) { Remove-Item x }",
  ]) {
    expect(analyze(command)).toEqual({ kind: "opaque" })
  }
}

function rejectDynamicExecution(): void {
  for (const command of [
    "Invoke-Expression 'Remove-Item x'",
    "iex $cmd",
    "Start-Process pwsh -ArgumentList '-Command','Remove-Item x'",
    "pwsh -Command Remove-Item x",
    "powershell.exe -EncodedCommand UgBlAG0AbwB2AGUA",
    "cmd /c del x",
    "& $cmd",
    "[scriptblock]::Create('Remove-Item x').Invoke()",
  ]) {
    expect(analyze(command)).toEqual({ kind: "opaque" })
  }
}

function rejectLineContinuationAndStopParsing(): void {
  expect(analyze("Get-ChildItem `\n  -Recurse")).toEqual({ kind: "opaque" })
  expect(analyze("npm run dev --% READY")).toEqual({ kind: "opaque" })
}

function keepPosixAnalysisOutsideWindows(): void {
  expect(analyzeCommand("tail -f app.log | grep --line-buffered ERROR", "darwin")).toEqual({
    kind: "analyzed",
    commands: ["tail -f app.log", "grep --line-buffered ERROR"],
  })
}

function registerTests(): void {
  test("separa o pipeline do PowerShell", splitPipeline)
  test("separa instruções com ;", splitStatements)
  test("extrai o comando de $( ) dentro de aspas", extractSubexpression)
  test("recusa blocos de script, que escondem comandos", rejectScriptBlocks)
  test(
    "recusa execução dinâmica: Invoke-Expression, Start-Process, pwsh -Command, cmd /c, & $var",
    rejectDynamicExecution,
  )
  test("recusa continuação de linha e --%", rejectLineContinuationAndStopParsing)
  test("fora do Windows continua usando a análise POSIX", keepPosixAnalysisOutsideWindows)
}

describe("separação de comandos PowerShell para permissão", registerTests)
