export function formatINR(amount) {
  const value = Number(amount || 0);
  return "\u20b9" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
