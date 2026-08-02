// src/utils/split.js
// Equal-split expense calculator: given a list of shared expenses and the set
// of approved member uids, computes each member's balance (paid - owed) and a
// minimal list of settlement transfers ("who owes whom").

export function computeBalances(expenses, memberUids) {
  const n = memberUids.length
  const balances = Object.fromEntries(memberUids.map((uid) => [uid, 0]))
  if (n === 0) return balances

  for (const exp of expenses) {
    const amount = Number(exp.amount) || 0
    const share = amount / n
    // Everyone owes an equal share...
    memberUids.forEach((uid) => {
      balances[uid] -= share
    })
    // ...and the payer is credited the full amount.
    if (balances[exp.paidByUid] !== undefined) {
      balances[exp.paidByUid] += amount
    }
  }
  // Round to avoid floating point dust.
  memberUids.forEach((uid) => {
    balances[uid] = Math.round(balances[uid] * 100) / 100
  })
  return balances
}

export function computeTotals(expenses) {
  return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}

// Greedy settlement algorithm: pairs the largest debtor with the largest
// creditor repeatedly until all balances are ~0. Produces a near-minimal
// number of transactions.
export function computeSettlements(balances) {
  const creditors = []
  const debtors = []
  Object.entries(balances).forEach(([uid, balance]) => {
    if (balance > 0.01) creditors.push({ uid, amount: balance })
    else if (balance < -0.01) debtors.push({ uid, amount: -balance })
  })

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0.01) {
      settlements.push({
        fromUid: debtor.uid,
        toUid: creditor.uid,
        amount: Math.round(amount * 100) / 100,
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount <= 0.01) i++
    if (creditor.amount <= 0.01) j++
  }

  return settlements
}
