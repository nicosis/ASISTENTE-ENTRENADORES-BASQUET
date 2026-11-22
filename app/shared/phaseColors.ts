// Presentation only: the catalog no longer stores phase colors.
const phaseColors = [
  '#4f7cac', '#5387a5', '#678a55', '#8a8547', '#9b7144', '#69778a', '#63875c',
  '#a27447', '#ad6147', '#69778a', '#497e73', '#765f86', '#526171',
] as const

export function phaseColorFor(phaseOrder: number): string {
  return phaseColors[(Math.max(1, phaseOrder) - 1) % phaseColors.length] ?? phaseColors[0]
}

export function phaseWeekNumbers(phase: { weekStart: number; weekEnd: number }): number[] {
  return Array.from({ length: phase.weekEnd - phase.weekStart + 1 }, (_, index) => phase.weekStart + index)
}
