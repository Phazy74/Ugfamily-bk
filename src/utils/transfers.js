export function generateReference() {
  return `TX-${Date.now()}-${Math.floor(1000 + Math.random()*9000)}`;
}

// Simple fee policy: free for local (adjust whenever)
export function calculateLocalFee(amount) {
  return 0;
}

// Validate against daily/monthly limits pulled from Account.limits
export async function checkLimits({ amount, AccountModel, TransactionModel, userId, session }) {
  const acct = await AccountModel.findOne({ user: userId }).session(session);
  if (!acct) throw new Error("Sender account not found");

  const { dailyTransferLimit = 5000, monthlyTransferLimit = 30000 } = acct.limits || {};

  // Sum completed outbound today / this month
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dayAgg] = await TransactionModel.aggregate([
    { $match: { "sender.user": acct.user, status: "completed", type: "local_transfer", createdAt: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]).session(session);

  const [monthAgg] = await TransactionModel.aggregate([
    { $match: { "sender.user": acct.user, status: "completed", type: "local_transfer", createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]).session(session);

  const usedToday = dayAgg?.total || 0;
  const usedMonth = monthAgg?.total || 0;

  if (usedToday + amount > dailyTransferLimit) {
    const remaining = Math.max(0, dailyTransferLimit - usedToday);
    const msg = remaining === 0
      ? "Daily transfer limit reached"
      : `Over daily limit. You can send up to $${remaining.toLocaleString()} today.`;
    return { ok: false, reason: msg };
  }

  if (usedMonth + amount > monthlyTransferLimit) {
    const remaining = Math.max(0, monthlyTransferLimit - usedMonth);
    const msg = remaining === 0
      ? "Monthly transfer limit reached"
      : `Over monthly limit. You can send up to $${remaining.toLocaleString()} this month.`;
    return { ok: false, reason: msg };
  }

  return { ok: true };
}
