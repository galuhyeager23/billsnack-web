export function formatPrice(value) {
  if (value === null || value === undefined) return '';
  // Accept numbers or numeric strings. Strip any non-digit characters except minus and dot/comma.
  const raw = String(value).replace(/[^0-9\-,.]/g, '').trim();
  // Try to parse to number; treat commas as thousand separators if necessary
  let num = Number(raw.replace(/\./g, '').replace(/,/g, '.'));
  if (Number.isNaN(num)) {
    num = Number(String(value).replace(/[^0-9]/g, '')) || 0;
  }
  // Format using Indonesian locale with no decimal places
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(num));
}

export default formatPrice;
