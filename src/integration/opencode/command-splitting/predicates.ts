import {
  AMPERSAND,
  CLOSING_KEYWORD,
  DYNAMIC_COMMAND,
  GREATER_THAN,
  HEREDOC_OPENER,
  HERESTRING_OPENER,
  ONE_CHARACTER_SEPARATORS,
  REDIRECTABLE_SEPARATORS,
  REDIRECTION_CHARACTERS,
  TWO_CHARACTER_SEPARATORS,
  WHITESPACE,
} from "./constants"

export function isDynamicCommand(command: string): boolean {
  return DYNAMIC_COMMAND.test(command)
}

export function isClosingKeyword(command: string): boolean {
  return CLOSING_KEYWORD.test(command)
}

export function isHeredoc(text: string, index: number): boolean {
  return text.startsWith(HEREDOC_OPENER, index) && !text.startsWith(HERESTRING_OPENER, index)
}

export function isTwoCharacterSeparator(text: string, index: number): boolean {
  return TWO_CHARACTER_SEPARATORS.some((separator) => text.startsWith(separator, index))
}

export function isOneCharacterSeparator(text: string, index: number): boolean {
  const char = text.charAt(index)
  const afterRedirection =
    REDIRECTION_CHARACTERS.includes(text.charAt(index - 1)) && REDIRECTABLE_SEPARATORS.includes(char)
  const beforeRedirection = char === AMPERSAND && text.charAt(index + 1) === GREATER_THAN

  return ONE_CHARACTER_SEPARATORS.includes(char) && !afterRedirection && !beforeRedirection
}

export function isWordStart(segment: string): boolean {
  return segment === "" || WHITESPACE.test(segment.charAt(segment.length - 1))
}
