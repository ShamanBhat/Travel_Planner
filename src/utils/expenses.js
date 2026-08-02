export function calculateBalances(expenses, memberUids) {
  const balances = {};
  memberUids.forEach((uid) => {
    balances[uid] = 0;
  });

  const sharedExpenses = expenses.filter((e) => e.type === 'shared');
  const splitCount = memberUids.length || 1;

  sharedExpenses.forEach((exp) => {
    const share = exp.amount / splitCount;
    memberUids.forEach((uid) => {
      balances[uid] -= share;
    });
    if (balances[exp.paidByUid] !== undefined) {
      balances[exp.paidByUid] += exp.amount;
    }
  });

  return balances;
}

export function calculateSettlements(balances) {
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([uid, balance]) => {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < -0.01) debtors.push({ uid, amount: -rounded });
    else if (rounded > 0.01) creditors.push({ uid, amount: rounded });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.01) {
      settlements.push({
        fromUid: debtors[i].uid,
        toUid: creditors[j].uid,
        amount: Math.round(pay * 100) / 100,
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getPersonalTotal(expenses, uid) {
  return expenses
    .filter((e) => e.type === 'personal' && e.paidByUid === uid)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getSharedTotal(expenses) {
  return expenses.filter((e) => e.type === 'shared').reduce((sum, e) => sum + e.amount, 0);
}
