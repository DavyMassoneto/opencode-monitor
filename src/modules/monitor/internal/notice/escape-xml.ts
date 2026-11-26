import { XML_SPECIAL_CHARACTERS } from "./constants"

export function escapeXml(value: string): string {
  return value.replace(XML_SPECIAL_CHARACTERS, (character) => `&#${character.charCodeAt(0)};`)
}
