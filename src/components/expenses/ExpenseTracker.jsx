// src/components/expenses/ExpenseTracker.jsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { Wallet, Plus } from 'lucide-react'
import { db } from '../../firebase'
import { useTrip } from '../../context/TripContext'
import { useAuth } from '../../context/AuthContext'
import { isEditor } from '../../utils/rbac'
import { computeBalances, computeSettlements, computeTotals } from '../../utils/split'
import AddExpenseModal from './AddExpenseModal'
import ExpenseList from './ExpenseList'
import SettlementSummary from './SettlementSummary'

export default function ExpenseTracker() {
  const { tripId, role, approvedMembers } = useTrip()
  const { currentUser } = useAuth()
  const editable = isEditor(role)

  const [sharedExpenses, setSharedExpenses] = useState([])
  const [personalExpenses, setPersonalExpenses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const expensesCol = collection(db, 'trips', tripId, 'expenses')

    // Query filters mirror the Firestore security rules exactly, so listing
    // (as opposed to single-doc get) is provably safe without reading data
    // that isn't authorized for this user.
    const sharedQuery = query(expensesCol, where('type', '==', 'shared'))
    const personalQuery = query(
      expensesCol,
      where('type', '==', 'personal'),
      where('visibilityUid', '==', currentUser.uid)
    )

    const unsubShared = onSnapshot(sharedQuery, (snap) => {
      setSharedExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsubPersonal = onSnapshot(personalQuery, (snap) => {
      setPersonalExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => {
      unsubShared()
      unsubPersonal()
    }
  }, [tripId, currentUser.uid])

  const memberUids = useMemo(() => approvedMembers.map((m) => m.uid), [approvedMembers])
  const balances = useMemo(() => computeBalances(sharedExpenses, memberUids), [sharedExpenses, memberUids])
  const settlements = useMemo(() => computeSettlements(balances), [balances])
  const sharedTotal = useMemo(() => computeTotals(sharedExpenses), [sharedExpenses])
  const personalTotal = useMemo(() => computeTotals(personalExpenses), [personalExpenses])

  function memberName(uid) {
    return approvedMembers.find((m) => m.uid === uid)?.displayName || 'Unknown'
  }

  async function handleSaveExpense(data) {
    await addDoc(collection(db, 'trips', tripId, 'expenses'), {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  async function handleDeleteShared(exp) {
    await deleteDoc(doc(db, 'trips', tripId, 'expenses', exp.id))
  }
  async function handleDeletePersonal(exp) {
    await deleteDoc(doc(db, 'trips', tripId, 'expenses', exp.id))
  }

  if (loading) return <p className="text-sm text-app-muted">Loading expenses...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-app-text flex items-center gap-2">
          <Wallet size={18} className="text-app-primary" /> Expenses
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app-primary text-app-primaryText text-sm font-medium hover:brightness-110 transition"
        >
          <Plus size={15} /> Add expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-app-border bg-app-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-app-text">Group (shared) expenses</h2>
            <span className="text-sm font-semibold text-app-text">₹{sharedTotal.toFixed(2)}</span>
          </div>
          <ExpenseList
            expenses={sharedExpenses}
            memberName={memberName}
            canDelete={(exp) => editable || exp.paidByUid === currentUser.uid}
            onDelete={handleDeleteShared}
            emptyLabel="No shared expenses logged yet."
          />

          <div className="mt-4 pt-3 border-t border-app-border">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-app-muted mb-2">
              Who owes whom
            </h3>
            <SettlementSummary settlements={settlements} memberName={memberName} />
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-app-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-app-text">My personal expenses</h2>
            <span className="text-sm font-semibold text-app-text">₹{personalTotal.toFixed(2)}</span>
          </div>
          <ExpenseList
            expenses={personalExpenses}
            memberName={memberName}
            canDelete
            onDelete={handleDeletePersonal}
            emptyLabel="No personal expenses logged yet. These are private to you."
          />
        </div>
      </div>

      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveExpense}
        approvedMembers={approvedMembers}
        currentUid={currentUser.uid}
        allowShared={editable}
      />
    </div>
  )
}
