import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Plus, Trash2, ArrowRight, Users } from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import {
  calculateBalances,
  calculateSettlements,
  formatCurrency,
  getPersonalTotal,
  getSharedTotal,
} from '../utils/expenses';
import { generateId, formatDate } from '../utils/dates';
import { getMemberDisplayName } from '../utils/roles';
import Modal from './ui/Modal';
import { EditButton, EmptyState, LoadingSpinner } from './ui/ReadOnlyField';

export default function ExpenseTracker() {
  const { user } = useAuth();
  const { tripId, trip } = useTrip();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shared');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    const ref = collection(db, 'trips', tripId, 'expenses');
    const unsubscribe = onSnapshot(ref, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [tripId]);

  const approvedMembers = useMemo(
    () =>
      Object.entries(trip?.members || {})
        .filter(([, m]) => m.status === 'approved')
        .map(([uid]) => uid),
    [trip?.members]
  );

  const sharedExpenses = expenses.filter((e) => e.type === 'shared');
  const personalExpenses = expenses.filter(
    (e) => e.type === 'personal' && e.paidByUid === user?.uid
  );

  const balances = calculateBalances(expenses, approvedMembers);
  const settlements = calculateSettlements(balances);

  const handleSave = async (formData) => {
    const id = formData.id || generateId();
    const ref = doc(db, 'trips', tripId, 'expenses', id);
    await setDoc(ref, {
      type: formData.type,
      amount: parseFloat(formData.amount),
      paidByUid: formData.paidByUid || user.uid,
      description: formData.description,
      date: formData.date,
      visibilityUid: formData.type === 'personal' ? user.uid : null,
    });
    setEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await deleteDoc(doc(db, 'trips', tripId, 'expenses', id));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Expenses</h2>
        <button
          onClick={() => {
            setEditingExpense(null);
            setEditModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-xs uppercase opacity-60">Shared Pool</p>
          <p className="text-xl font-bold">{formatCurrency(getSharedTotal(expenses))}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase opacity-60">My Personal</p>
          <p className="text-xl font-bold">{formatCurrency(getPersonalTotal(expenses, user?.uid))}</p>
        </div>
        <div className="card col-span-2 text-center sm:col-span-1">
          <p className="text-xs uppercase opacity-60">My Balance</p>
          <p className={`text-xl font-bold ${balances[user?.uid] >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(balances[user?.uid] || 0)}
          </p>
        </div>
      </div>

      {settlements.length > 0 && (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Users size={18} />
            Who Owes Whom
          </h3>
          <div className="space-y-2">
            {settlements.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{getMemberDisplayName(trip?.members, s.fromUid)}</span>
                <ArrowRight size={14} className="opacity-40" />
                <span className="font-medium">{getMemberDisplayName(trip?.members, s.toUid)}</span>
                <span className="ml-auto font-bold">{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b border-inherit">
        <button
          onClick={() => setActiveTab('shared')}
          className={`pb-2 text-sm font-medium ${activeTab === 'shared' ? 'tab-active' : 'opacity-60'}`}
        >
          Shared ({sharedExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`pb-2 text-sm font-medium ${activeTab === 'personal' ? 'tab-active' : 'opacity-60'}`}
        >
          My Personal ({personalExpenses.length})
        </button>
      </div>

      {(activeTab === 'shared' ? sharedExpenses : personalExpenses).length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No expenses yet"
          description="Track shared and personal trip expenses here."
        />
      ) : (
        <div className="space-y-2">
          {(activeTab === 'shared' ? sharedExpenses : personalExpenses).map((exp) => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              members={trip?.members}
              perPerson={
                activeTab === 'shared' && approvedMembers.length
                  ? exp.amount / approvedMembers.length
                  : null
              }
              canDelete={exp.paidByUid === user?.uid || exp.type === 'shared'}
              onEdit={() => {
                setEditingExpense(exp);
                setEditModalOpen(true);
              }}
              onDelete={() => handleDelete(exp.id)}
            />
          ))}
        </div>
      )}

      <ExpenseEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        defaultTab={activeTab}
        members={trip?.members}
        approvedMembers={approvedMembers}
        currentUid={user?.uid}
        onSave={handleSave}
      />
    </div>
  );
}

function ExpenseRow({ expense, members, perPerson, canDelete, onEdit, onDelete }) {
  return (
    <div className="card !p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{expense.description}</p>
        <p className="text-xs opacity-60">
          {formatDate(expense.date)} · Paid by {getMemberDisplayName(members, expense.paidByUid)}
          {perPerson && ` · ${formatCurrency(perPerson)}/person`}
        </p>
      </div>
      <p className="font-bold">{formatCurrency(expense.amount)}</p>
      {canDelete && (
        <div className="flex gap-1">
          <EditButton onClick={onEdit} />
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 opacity-50 hover:opacity-100 hover:text-red-500"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function ExpenseEditModal({ isOpen, onClose, expense, defaultTab, members, approvedMembers, currentUid, onSave }) {
  const [form, setForm] = useState({
    id: '',
    type: 'shared',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paidByUid: '',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        id: expense?.id || '',
        type: expense?.type || defaultTab,
        amount: expense?.amount?.toString() || '',
        description: expense?.description || '',
        date: expense?.date || new Date().toISOString().split('T')[0],
        paidByUid: expense?.paidByUid || currentUid,
      });
    }
  }, [isOpen, expense, defaultTab, currentUid]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            className="input-field"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="shared">Shared (split equally)</option>
            <option value="personal">Personal (private)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <input
            className="input-field"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        {form.type === 'shared' && (
          <div>
            <label className="mb-1 block text-sm font-medium">Paid By</label>
            <select
              className="input-field"
              value={form.paidByUid}
              onChange={(e) => setForm({ ...form, paidByUid: e.target.value })}
            >
              {approvedMembers.map((uid) => (
                <option key={uid} value={uid}>
                  {getMemberDisplayName(members, uid)}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
