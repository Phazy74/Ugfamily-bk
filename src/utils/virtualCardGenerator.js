export function generateCardNumber(type) {
  const prefixes = {
    visa: "4",
    mastercard: "5",
    amex: "3"
  };

  const prefix = prefixes[type] || "4";

  let num = prefix;
  while (num.length < 16) {
    num += Math.floor(Math.random() * 10);
  }

  return num.replace(/(.{4})/g, "$1 ").trim();
}

export function generateExpiry() {
  const month = Math.floor(Math.random() * 12) + 1;
  const year = Math.floor(Math.random() * 6) + 26; 
  return { month, year };
}

export function generateCVV(type) {
  return type === "amex"
    ? String(Math.floor(1000 + Math.random() * 9000)) // 4 digits for AMEX
    : String(Math.floor(100 + Math.random() * 900));   // 3 digits others
}
