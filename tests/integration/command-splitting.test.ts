import { describe, expect, test } from "vitest"
import { type CommandAnalysis, CommandScanner } from "#monitor/integration"

function analyze(command: string): CommandAnalysis {
  return new CommandScanner(command).analyze()
}

function keepSimpleCommand(): void {
  expect(analyze("tail -f app.log")).toEqual({ kind: "analyzed", commands: ["tail -f app.log"] })
}

function splitOnEverySeparator(): void {
  expect(analyze("echo ok; rm x && ls || pwd | grep a & sleep 1\ndate |& cat")).toEqual({
    kind: "analyzed",
    commands: ["echo ok", "rm x", "ls", "pwd", "grep a", "sleep 1", "date", "cat"],
  })
}

function keepQuotedSeparators(): void {
  expect(analyze(`echo 'a; rm x' "b && c"`)).toEqual({ kind: "analyzed", commands: [`echo 'a; rm x' "b && c"`] })
}

function keepEscapedSeparator(): void {
  expect(analyze("echo a\\; rm x")).toEqual({ kind: "analyzed", commands: ["echo a\\; rm x"] })
}

function extractSubstitutions(): void {
  expect(analyze("echo $(rm x) `rm y` <(rm z)")).toEqual({
    kind: "analyzed",
    commands: ["rm x", "rm y", "rm z", "echo $(rm x) `rm y` <(rm z)"],
  })
}

function extractSubstitutionInDoubleQuotes(): void {
  expect(analyze(`echo "now $(rm x)"`)).toEqual({ kind: "analyzed", commands: ["rm x", `echo "now $(rm x)"`] })
}

function stripGroupsAndKeywords(): void {
  expect(analyze("(rm x); { rm y; }; if true; then rm z; fi; while true; do rm w; done")).toEqual({
    kind: "analyzed",
    commands: ["rm x", "rm y", "true", "rm z", "rm w"],
  })
}

function keepRedirections(): void {
  expect(analyze("make 2>&1 | grep --line-buffered ERROR &> out.log")).toEqual({
    kind: "analyzed",
    commands: ["make 2>&1", "grep --line-buffered ERROR &> out.log"],
  })
}

function stripAssignmentsAndPrefixes(): void {
  expect(analyze("FOO=1 BAR='a b' rm x; i=$((i+1)); nohup rm y")).toEqual({
    kind: "analyzed",
    commands: ["rm x", "rm y"],
  })
}

function skipComments(): void {
  expect(analyze("rm x # ; rm y\necho a#b")).toEqual({ kind: "analyzed", commands: ["rm x", "echo a#b"] })
}

function acceptHereString(): void {
  expect(analyze("grep a <<< 'x'")).toEqual({ kind: "analyzed", commands: ["grep a <<< 'x'"] })
}

function returnNothingForAssignmentOnly(): void {
  expect(analyze("FOO=1")).toEqual({ kind: "analyzed", commands: [] })
}

function rejectUnclosedQuote(): void {
  expect(analyze("echo 'oops; rm x")).toEqual({ kind: "opaque" })
}

function rejectHeredoc(): void {
  expect(analyze("cat <<EOF\nrm x\nEOF")).toEqual({ kind: "opaque" })
}

function rejectEval(): void {
  expect(analyze("echo ok; eval rm x")).toEqual({ kind: "opaque" })
}

function rejectNestedShell(): void {
  expect(analyze("bash -c 'rm x'")).toEqual({ kind: "opaque" })
  expect(analyze("/bin/sh -lc 'rm x'")).toEqual({ kind: "opaque" })
}

function rejectSourcedScript(): void {
  expect(analyze("source ./script.sh")).toEqual({ kind: "opaque" })
}

function rejectUnbalancedParentheses(): void {
  expect(analyze("rm x)")).toEqual({ kind: "opaque" })
  expect(analyze("echo $(rm x")).toEqual({ kind: "opaque" })
}

function rejectTrailingBackslash(): void {
  expect(analyze("rm x \\")).toEqual({ kind: "opaque" })
}

function registerTests(): void {
  test("mantém comando simples", keepSimpleCommand)
  test("separa em ; && || | & |& e quebra de linha", splitOnEverySeparator)
  test("não separa dentro de aspas", keepQuotedSeparators)
  test("não separa em separador escapado", keepEscapedSeparator)
  test("extrai comandos de $( ), crases e <( )", extractSubstitutions)
  test("extrai substituição dentro de aspas duplas", extractSubstitutionInDoubleQuotes)
  test("remove agrupamentos e palavras reservadas", stripGroupsAndKeywords)
  test("não confunde redirecionamento com separador", keepRedirections)
  test("remove atribuições e prefixos como nohup", stripAssignmentsAndPrefixes)
  test("ignora comentários", skipComments)
  test("aceita here-string", acceptHereString)
  test("não devolve comando para atribuição pura", returnNothingForAssignmentOnly)
  test("recusa aspas sem fechamento", rejectUnclosedQuote)
  test("recusa heredoc", rejectHeredoc)
  test("recusa eval", rejectEval)
  test("recusa shell aninhado com -c", rejectNestedShell)
  test("recusa script carregado com source", rejectSourcedScript)
  test("recusa parênteses desbalanceados", rejectUnbalancedParentheses)
  test("recusa barra invertida no fim", rejectTrailingBackslash)
}

describe("separação de comandos para permissão", registerTests)
