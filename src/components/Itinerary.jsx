import { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { generateId, formatDate, getDateRange, formatTime } from '../utils/dates';
import Modal from './ui/Modal';
import ReadOnlyField, { EditButton, EmptyState, LoadingSpinner } from './ui/ReadOnlyField';

export default function Itinerary() {
  const { user } = useAuth();
  const { tripId, canEdit, trip } = useTrip();
  const { docs, loading } = useFirestoreCollection(`trips/${tripId}/itinerary`, !!tripId);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingDayDate, setEditingDayDate] = useState(null);

  const dayDates = useMemo(
    () => getDateRange(trip?.startDate, trip?.endDate),
    [trip?.startDate, trip?.endDate]
  );

  const activeDay = selectedDay || dayDates[0] || null;

  const dayDoc = docs.find((d) => d.dayDate === activeDay);
  const items = (dayDoc?.items || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const saveDayItems = async (dayDate, items) => {
    const ref = doc(db, 'trips', tripId, 'itinerary', dayDate);
    await setDoc(ref, { dayDate, items });
  };

  const handleSaveItem = async (formData) => {
    const dayDate = editingDayDate || activeDay;
    const existingDoc = docs.find((d) => d.dayDate === dayDate);
    const currentItems = existingDoc?.items || [];

    let updatedItems;
    if (formData.id && currentItems.some((i) => i.id === formData.id)) {
      updatedItems = currentItems.map((i) =>
        i.id === formData.id ? { ...formData, createdBy: i.createdBy || user.uid } : i
      );
    } else {
      updatedItems = [
        ...currentItems,
        { ...formData, id: formData.id || generateId(), createdBy: user.uid },
      ];
    }

    await saveDayItems(dayDate, updatedItems);
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this activity?')) return;
    const updatedItems = items.filter((i) => i.id !== itemId);
    await saveDayItems(activeDay, updatedItems);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Itinerary</h2>
        {canEdit() && activeDay && (
          <button
            onClick={() => {
              setEditingItem(null);
              setEditingDayDate(activeDay);
              setEditModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} />
            Add Activity
          </button>
        )}
      </div>

      {dayDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {dayDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDay(date)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeDay === date ? 'tab-active bg-inherit' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      )}

      {!activeDay ? (
        <EmptyState
          icon={Calendar}
          title="No trip dates set"
          description="Set start and end dates in trip settings to build an itinerary."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No activities for this day"
          description={canEdit() ? 'Add your first activity to get started.' : 'Activities will appear here.'}
        />
      ) : (
        <div className="relative space-y-0">
          {items.map((item, idx) => (
            <div key={item.id} className="relative flex gap-4 pb-6">
              {idx < items.length - 1 && (
                <div className="absolute left-[11px] top-6 h-full w-0.5 bg-current opacity-10" />
              )}
              <div className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-current bg-inherit" />
              <div className="card flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm opacity-70">
                      <Clock size={14} />
                      {formatTime(item.time) || 'All day'}
                    </div>
                    <h3 className="mt-1 font-semibold">{item.title}</h3>
                  </div>
                  {canEdit() && (
                    <div className="flex gap-1">
                      <EditButton
                        onClick={() => {
                          setEditingItem(item);
                          setEditingDayDate(activeDay);
                          setEditModalOpen(true);
                        }}
                      />
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="rounded-lg p-1.5 opacity-50 hover:opacity-100 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {item.description && <p className="text-sm opacity-80">{item.description}</p>}
                {item.location && (
                  <div className="flex items-center gap-1 text-sm opacity-60">
                    <MapPin size={14} />
                    {item.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ActivityEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleSaveItem}
      />
    </div>
  );
}

function ActivityEditModal({ isOpen, onClose, item, onSave }) {
  const [form, setForm] = useState({ id: '', time: '', title: '', description: '', location: '' });

  useEffect(() => {
    if (isOpen) {
      setForm({
        id: item?.id || '',
        time: item?.time || '',
        title: item?.title || '',
        description: item?.description || '',
        location: item?.location || '',
      });
    }
  }, [isOpen, item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Activity' : 'Add Activity'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Time</label>
          <input
            type="time"
            className="input-field"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            className="input-field min-h-[80px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input
            className="input-field"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
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
