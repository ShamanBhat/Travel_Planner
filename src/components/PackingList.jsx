import { useState, useEffect } from 'react';
import { Backpack, Download, Plus, Trash2, Check, Package } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { generateId } from '../utils/dates';
import { getMemberDisplayName } from '../utils/roles';
import Modal from './ui/Modal';
import { EditButton, EmptyState, LoadingSpinner } from './ui/ReadOnlyField';

const SHARED_DOC_ID = 'main';

const CATEGORIES = ['Clothing', 'Electronics', 'Toiletries', 'Documents', 'Gear', 'Food', 'Other'];

export default function PackingList() {
  const { user } = useAuth();
  const { tripId, canEdit, trip } = useTrip();
  const [activeTab, setActiveTab] = useState('shared');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: sharedData, loading: sharedLoading } = useFirestoreDoc(
    `trips/${tripId}/sharedPacking`,
    SHARED_DOC_ID,
    !!tripId
  );
  const { data: personalData, loading: personalLoading } = useFirestoreDoc(
    `trips/${tripId}/personalPacking`,
    user?.uid,
    !!tripId && !!user
  );

  const sharedItems = sharedData?.items || [];
  const personalItems = personalData?.items || [];
  const loading = sharedLoading || personalLoading;

  const saveShared = async (items) => {
    const ref = doc(db, 'trips', tripId, 'sharedPacking', SHARED_DOC_ID);
    await setDoc(ref, { items }, { merge: true });
  };

  const savePersonal = async (items) => {
    const ref = doc(db, 'trips', tripId, 'personalPacking', user.uid);
    await setDoc(ref, { items }, { merge: true });
  };

  const handleSaveItem = async (formData) => {
    if (activeTab === 'shared') {
      const items = [...sharedItems];
      if (formData.id && items.some((i) => i.id === formData.id)) {
        const idx = items.findIndex((i) => i.id === formData.id);
        items[idx] = formData;
      } else {
        items.push({ ...formData, id: formData.id || generateId() });
      }
      await saveShared(items);
    } else {
      const items = [...personalItems];
      if (formData.id && items.some((i) => i.id === formData.id)) {
        const idx = items.findIndex((i) => i.id === formData.id);
        items[idx] = formData;
      } else {
        items.push({
          ...formData,
          id: formData.id || generateId(),
          isPacked: false,
          importedFromShared: false,
        });
      }
      await savePersonal(items);
    }
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const togglePacked = async (itemId) => {
    const items = personalItems.map((i) =>
      i.id === itemId ? { ...i, isPacked: !i.isPacked } : i
    );
    await savePersonal(items);
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Remove this item?')) return;
    if (activeTab === 'shared') {
      await saveShared(sharedItems.filter((i) => i.id !== itemId));
    } else {
      await savePersonal(personalItems.filter((i) => i.id !== itemId));
    }
  };

  const importSharedToPersonal = async () => {
    const existingNames = new Set(personalItems.map((i) => i.item.toLowerCase()));
    const newItems = sharedItems
      .filter((s) => !existingNames.has(s.item.toLowerCase()))
      .map((s) => ({
        id: generateId(),
        item: s.item,
        category: s.category,
        isPacked: false,
        importedFromShared: true,
      }));

    if (newItems.length === 0) {
      alert('All shared items are already in your personal list.');
      return;
    }

    await savePersonal([...personalItems, ...newItems]);
    setActiveTab('personal');
  };

  const currentItems = activeTab === 'shared' ? sharedItems : personalItems;
  const packedCount = personalItems.filter((i) => i.isPacked).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Packing Lists</h2>
        <div className="flex gap-2">
          {activeTab === 'personal' && sharedItems.length > 0 && (
            <button onClick={importSharedToPersonal} className="btn-secondary">
              <Download size={16} />
              Import Shared
            </button>
          )}
          {(activeTab === 'personal' || canEdit()) && (
            <button
              onClick={() => {
                setEditingItem(null);
                setEditModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} />
              Add Item
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-inherit">
        <button
          onClick={() => setActiveTab('shared')}
          className={`pb-2 text-sm font-medium ${activeTab === 'shared' ? 'tab-active' : 'opacity-60'}`}
        >
          <Package size={16} className="mr-1 inline" />
          Shared ({sharedItems.length})
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`pb-2 text-sm font-medium ${activeTab === 'personal' ? 'tab-active' : 'opacity-60'}`}
        >
          <Backpack size={16} className="mr-1 inline" />
          My List ({packedCount}/{personalItems.length})
        </button>
      </div>

      {currentItems.length === 0 ? (
        <EmptyState
          icon={Backpack}
          title={activeTab === 'shared' ? 'No shared items' : 'Your list is empty'}
          description={
            activeTab === 'shared'
              ? canEdit()
                ? 'Add items for the whole group.'
                : 'Shared packing list will appear here.'
              : 'Add personal items or import from shared list.'
          }
        />
      ) : (
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const catItems = currentItems.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide opacity-50">{cat}</p>
                {catItems.map((item) => (
                  <PackingItemRow
                    key={item.id}
                    item={item}
                    isPersonal={activeTab === 'personal'}
                    members={trip?.members}
                    canEdit={activeTab === 'shared' ? canEdit() : true}
                    onToggle={() => togglePacked(item.id)}
                    onEdit={() => {
                      setEditingItem(item);
                      setEditModalOpen(true);
                    }}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            );
          })}
          {currentItems.filter((i) => !CATEGORIES.includes(i.category)).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide opacity-50">Uncategorized</p>
              {currentItems
                .filter((i) => !CATEGORIES.includes(i.category))
                .map((item) => (
                  <PackingItemRow
                    key={item.id}
                    item={item}
                    isPersonal={activeTab === 'personal'}
                    members={trip?.members}
                    canEdit={activeTab === 'shared' ? canEdit() : true}
                    onToggle={() => togglePacked(item.id)}
                    onEdit={() => {
                      setEditingItem(item);
                      setEditModalOpen(true);
                    }}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      <PackingEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        isShared={activeTab === 'shared'}
        members={trip?.members}
        approvedMembers={Object.entries(trip?.members || {})
          .filter(([, m]) => m.status === 'approved')
          .map(([uid]) => uid)}
        onSave={handleSaveItem}
      />
    </div>
  );
}

function PackingItemRow({ item, isPersonal, members, canEdit, onToggle, onEdit, onDelete }) {
  return (
    <div className="card !p-3 mb-2 flex items-center gap-3">
      {isPersonal && (
        <button
          onClick={onToggle}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            item.isPacked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-current opacity-30'
          }`}
          aria-label={item.isPacked ? 'Mark unpacked' : 'Mark packed'}
        >
          {item.isPacked && <Check size={14} />}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.isPacked ? 'line-through opacity-50' : ''}`}>
          {item.item}
        </p>
        {item.assignedToUid && (
          <p className="text-xs opacity-50">
            Assigned: {getMemberDisplayName(members, item.assignedToUid)}
          </p>
        )}
        {item.importedFromShared && (
          <p className="text-xs opacity-40">Imported from shared</p>
        )}
      </div>
      {canEdit && (
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

function PackingEditModal({ isOpen, onClose, item, isShared, members, approvedMembers, onSave }) {
  const [form, setForm] = useState({ id: '', item: '', category: 'Other', assignedToUid: '' });

  useEffect(() => {
    if (isOpen) {
      setForm({
        id: item?.id || '',
        item: item?.item || '',
        category: item?.category || 'Other',
        assignedToUid: item?.assignedToUid || '',
      });
    }
  }, [isOpen, item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Item' : 'Add Item'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Item</label>
          <input
            className="input-field"
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            className="input-field"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {isShared && (
          <div>
            <label className="mb-1 block text-sm font-medium">Assign To (optional)</label>
            <select
              className="input-field"
              value={form.assignedToUid}
              onChange={(e) => setForm({ ...form, assignedToUid: e.target.value })}
            >
              <option value="">Anyone</option>
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
