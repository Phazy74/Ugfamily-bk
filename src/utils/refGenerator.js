export function generateReference() {
  return "INT-" + Date.now() + "-" + Math.floor(Math.random() * 99999);
}
