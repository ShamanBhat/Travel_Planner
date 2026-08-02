// src/components/expenses/SettlementSummary.jsx
import React from 'react'
import { ArrowRight } from 'lucide-react'

export default function SettlementSummary({ settlements, memberName }) {
  if (settlements.length === 0) {
    return <p className="text-xs text-app-muted italic">Everyone is settled up. No transfers needed.</p>
  }
  return (
    <ul className="space-y-1.5">
      {settlements.map((s, idx) => (
        <li
          key={idx}
          className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-app-surfaceAlt"
        >
          <span className="flex items-center gap-1.5 text-app-text">
            {memberName(s.fromUid)} <ArrowRight size={13} className="text-app-muted" /> {memberName(s.toUid)}
          </span>
          <span className="font-semibold text-app-primary">₹{s.amount.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  )
}
