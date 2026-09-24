export function usd(value: number, digits = 2) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function compact(value: number) {
  return `$${value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
}

export function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function qty(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}
