import {
  ANALYZED_KIND,
  ARITHMETIC_OPENER,
  BACKSLASH,
  BACKTICK,
  COMMENT_START,
  DOLLAR_SUBSTITUTION,
  DOUBLE_QUOTE,
  GROUP_CLOSE,
  GROUP_OPEN,
  HERESTRING_OPENER,
  NEWLINE,
  NO_TERMINATOR,
  NOT_FOUND,
  OPAQUE_KIND,
  SINGLE_QUOTE,
  SUBSTITUTION_END,
  SUBSTITUTION_OPENERS,
} from "./constants"
import { normalizeCommand } from "./normalize-command"
import {
  isDynamicCommand,
  isHeredoc,
  isOneCharacterSeparator,
  isTwoCharacterSeparator,
  isWordStart,
} from "./predicates"
import { type CommandAnalysis, type ListState } from "./types"

export class CommandScanner {
  private readonly text: string
  private readonly commands: string[] = []
  private index = 0
  private opaque = false

  constructor(text: string) {
    this.text = text
  }

  analyze(): CommandAnalysis {
    this.readList(NO_TERMINATOR)
    if (this.opaque || this.index < this.text.length) {
      return { kind: OPAQUE_KIND }
    }
    return { kind: ANALYZED_KIND, commands: Array.from(new Set(this.commands)) }
  }

  private readList(terminator: string): void {
    const state: ListState = { terminator, segment: "", groups: 0, done: false }

    while (this.index < this.text.length && !state.done && !this.opaque) {
      this.step(state)
    }
    this.push(state.segment)
  }

  private step(state: ListState): void {
    const char = this.text.charAt(this.index)

    if (char === state.terminator && state.groups === 0) {
      state.done = true
    } else if (isTwoCharacterSeparator(this.text, this.index)) {
      this.separate(state, 2)
    } else if (isOneCharacterSeparator(this.text, this.index)) {
      this.separate(state, 1)
    } else if (char === GROUP_OPEN || char === GROUP_CLOSE) {
      this.group(state, char)
    } else if (char === COMMENT_START && isWordStart(state.segment)) {
      this.skipComment()
    } else {
      state.segment += this.readUnit()
    }
  }

  private separate(state: ListState, length: number): void {
    this.push(state.segment)
    state.segment = ""
    this.index += length
  }

  private group(state: ListState, char: string): void {
    if (char === GROUP_OPEN && state.segment.trim() === "") {
      state.groups += 1
      this.separate(state, 1)
    } else if (char === GROUP_CLOSE && state.groups > 0) {
      state.groups -= 1
      this.separate(state, 1)
    } else {
      this.opaque = true
    }
  }

  private skipComment(): void {
    const end = this.text.indexOf(NEWLINE, this.index)

    this.index = end === NOT_FOUND ? this.text.length : end
  }

  private readUnit(): string {
    const start = this.index
    const char = this.text.charAt(this.index)
    const opener = SUBSTITUTION_OPENERS.find((candidate) => this.text.startsWith(candidate, this.index))

    if (isHeredoc(this.text, this.index)) {
      this.opaque = true
    } else if (this.text.startsWith(HERESTRING_OPENER, this.index)) {
      this.index += HERESTRING_OPENER.length
    } else if (char === BACKSLASH) {
      this.readEscape()
    } else if (char === SINGLE_QUOTE) {
      this.readSingleQuoted()
    } else if (char === DOUBLE_QUOTE) {
      this.readDoubleQuoted()
    } else if (this.text.startsWith(ARITHMETIC_OPENER, this.index)) {
      this.readArithmetic()
    } else if (opener) {
      this.readSubstitution(opener.length, SUBSTITUTION_END)
    } else if (char === BACKTICK) {
      this.readSubstitution(1, BACKTICK)
    } else {
      this.index += 1
    }
    return this.text.slice(start, this.index)
  }

  private readEscape(): void {
    if (this.index + 1 >= this.text.length) {
      this.opaque = true
    }
    this.index += 2
  }

  private readSingleQuoted(): void {
    const end = this.text.indexOf(SINGLE_QUOTE, this.index + 1)

    if (end === NOT_FOUND) {
      this.opaque = true
      this.index = this.text.length
    } else {
      this.index = end + 1
    }
  }

  private readDoubleQuoted(): void {
    this.index += 1
    while (this.index < this.text.length && this.text.charAt(this.index) !== DOUBLE_QUOTE && !this.opaque) {
      this.readQuotedUnit()
    }
    if (this.text.charAt(this.index) === DOUBLE_QUOTE) {
      this.index += 1
    } else {
      this.opaque = true
    }
  }

  private readQuotedUnit(): void {
    const char = this.text.charAt(this.index)

    if (char === BACKSLASH) {
      this.readEscape()
    } else if (this.text.startsWith(ARITHMETIC_OPENER, this.index)) {
      this.readArithmetic()
    } else if (this.text.startsWith(DOLLAR_SUBSTITUTION, this.index)) {
      this.readSubstitution(DOLLAR_SUBSTITUTION.length, SUBSTITUTION_END)
    } else if (char === BACKTICK) {
      this.readSubstitution(1, BACKTICK)
    } else {
      this.index += 1
    }
  }

  private readArithmetic(): void {
    let depth = 2

    this.index += ARITHMETIC_OPENER.length
    while (this.index < this.text.length && depth > 0) {
      const char = this.text.charAt(this.index)
      if (char === GROUP_OPEN) {
        depth += 1
      } else if (char === GROUP_CLOSE) {
        depth -= 1
      }
      this.index += 1
    }
    this.opaque = this.opaque || depth > 0
  }

  private readSubstitution(openerLength: number, terminator: string): void {
    this.index += openerLength
    this.readList(terminator)
    if (this.text.charAt(this.index) === terminator) {
      this.index += 1
    } else {
      this.opaque = true
    }
  }

  private push(segment: string): void {
    const command = normalizeCommand(segment)

    if (isDynamicCommand(command)) {
      this.opaque = true
    } else if (command) {
      this.commands.push(command)
    }
  }
}
