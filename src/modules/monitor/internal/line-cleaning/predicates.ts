import {
  DELETE_CODE,
  FIRST_C1_CODE,
  FIRST_FINAL_BYTE_CODE,
  FIRST_PRINTABLE_CODE,
  LAST_C1_CODE,
  LAST_FINAL_BYTE_CODE,
  TAB_CODE,
} from "./constants"

export function isVisibleCode(code: number): boolean {
  const isControl = code < FIRST_PRINTABLE_CODE || code === DELETE_CODE
  const isC1Control = code >= FIRST_C1_CODE && code <= LAST_C1_CODE

  return code === TAB_CODE || !(isControl || isC1Control)
}

export function isFinalByte(code: number): boolean {
  return code >= FIRST_FINAL_BYTE_CODE && code <= LAST_FINAL_BYTE_CODE
}
