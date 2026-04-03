import { toValue, type MaybeRefOrGetter } from 'vue'

export const MM_PER_IN = 25.4

export type Unit = 'mm' | 'in'

/**
 * Composable providing unit-aware formatting and conversion utilities.
 *
 * @param unit - MaybeRefOrGetter returning the active unit ('mm' | 'in').
 *               Pass `() => props.unit` from any component.
 */
export function useUnitFormat(unit: MaybeRefOrGetter<string>) {
  const getUnit = (): Unit => toValue(unit) as Unit

  /**
   * Format a mm value for display.
   * Canvas / legend precision: mm → 1 dp, in → 3 dp.
   */
  const fmt = (v: number | null | undefined): string => {
    if (v == null || isNaN(v as number)) return '0'
    return getUnit() === 'in'
      ? ((v as number) / MM_PER_IN).toFixed(3)
      : (v as number).toFixed(1)
  }

  /**
   * High-precision format for tables and inputs.
   * mm → 2 dp, in → 4 dp.
   */
  const fmtPrecise = (v: number | null | undefined): string => {
    if (v == null || isNaN(v as number)) return '0'
    return getUnit() === 'in'
      ? ((v as number) / MM_PER_IN).toFixed(4)
      : (v as number).toFixed(2)
  }

  /** Convert a mm value to the display unit (returns a number). */
  const toDisplay = (mm: number): number =>
    getUnit() === 'in' ? +(mm / MM_PER_IN).toFixed(4) : +mm.toFixed(2)

  /** Convert a display-unit value back to mm (returns a number). */
  const fromDisplay = (v: number | string): number =>
    getUnit() === 'in' ? +(Number(v) * MM_PER_IN).toFixed(4) : Number(v)

  return { fmt, fmtPrecise, toDisplay, fromDisplay }
}
