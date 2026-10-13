export function formatMoney(minor, currency = "inr") {
  const code = currency.toUpperCase();
  const zeroDecimal = ["JPY", "KRW", "VND"].includes(code);
  const value = zeroDecimal ? minor : minor / 100;
  const locale = code === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const STATUS_LABEL = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  cancelled: "Cancelled",
};
