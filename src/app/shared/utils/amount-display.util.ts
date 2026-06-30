export function formatDisplayedAmount(amount: number): string {
  return Math.round(amount).toLocaleString('es-PY');
}
