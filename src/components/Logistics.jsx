import { useState, useEffect } from 'react';
import { Plane, QrCode, Upload, User } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { generateId, formatDateTime } from '../utils/dates';
import { getMemberDisplayName } from '../utils/roles';
import Modal from './ui/Modal';
import ReadOnlyField, { EditButton, EmptyState, LoadingSpinner } from './ui/ReadOnlyField';

const LOGISTICS_DOC_ID = 'main';

const EMPTY_LOGISTICS = { items: [] };

export default function Logistics() {
  const { user } = useAuth();
  const { tripId, canEdit, trip } = useTrip();
  const { data, loading } = useFirestoreDoc(`trips/${tripId}/logistics`, LOGISTICS_DOC_ID, !!tripId);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [boardingPassOpen, setBoardingPassOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const logistics = data || EMPTY_LOGISTICS;
  const flights = logistics.items?.filter((i) => i.type === 'flight') || [];
  const approvedMembers = Object.entries(trip?.members || {})
    .filter(([, m]) => m.status === 'approved')
    .map(([uid]) => uid);

  const myFlightPass = flights.flatMap((f) =>
    (f.passengers || [])
      .filter((p) => p.uid === user?.uid)
      .map((p) => ({ ...p, flight: f }))
  )[0];

  const saveLogistics = async (items) => {
    const ref = doc(db, 'trips', tripId, 'logistics', LOGISTICS_DOC_ID);
    await setDoc(ref, { items }, { merge: true });
  };

  const handleSaveFlight = async (formData) => {
    const items = [...(logistics.items || [])];
    const existingIdx = items.findIndex((i) => i.id === formData.id);

    const flightItem = {
      id: formData.id || generateId(),
      type: 'flight',
      provider: formData.provider,
      flightNo: formData.flightNo,
      pnr: formData.pnr,
      departureTime: formData.departureTime,
      arrivalTime: formData.arrivalTime,
      passengers: formData.passengers || [],
      details: formData.details || '',
      notes: formData.notes || '',
    };

    if (existingIdx >= 0) {
      items[existingIdx] = flightItem;
    } else {
      items.push(flightItem);
    }

    await saveLogistics(items);
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const handleUploadBoardingPass = async (flightId, uid, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `trips/${tripId}/boarding-passes/${flightId}/${uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const items = [...(logistics.items || [])];
      const flightIdx = items.findIndex((i) => i.id === flightId);
      if (flightIdx < 0) return;

      const passengers = [...(items[flightIdx].passengers || [])];
      const pIdx = passengers.findIndex((p) => p.uid === uid);
      if (pIdx >= 0) {
        passengers[pIdx] = { ...passengers[pIdx], boardingPassUrl: url };
      } else {
        passengers.push({ uid, seatNo: '', boardingPassUrl: url });
      }
      items[flightIdx] = { ...items[flightIdx], passengers };
      await saveLogistics(items);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Flight Logistics</h2>
        <div className="flex gap-2">
          {myFlightPass?.boardingPassUrl && (
            <button
              onClick={() => setBoardingPassOpen(true)}
              className="btn-primary !bg-emerald-600 hover:!bg-emerald-700"
            >
              <QrCode size={18} />
              My Boarding Pass
            </button>
          )}
          {canEdit() && (
            <button
              onClick={() => {
                setEditingItem(null);
                setEditModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plane size={18} />
              {flights.length ? 'Edit Flight' : 'Add Flight'}
            </button>
          )}
        </div>
      </div>

      {flights.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No flight details yet"
          description={canEdit() ? 'Add group flight information for all travelers.' : 'Flight details will appear here.'}
        />
      ) : (
        flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            members={trip?.members}
            approvedMembers={approvedMembers}
            canEdit={canEdit()}
            onEdit={() => {
              setEditingItem(flight);
              setEditModalOpen(true);
            }}
          />
        ))
      )}

      <FlightEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        flight={editingItem}
        approvedMembers={approvedMembers}
        members={trip?.members}
        onSave={handleSaveFlight}
        onUpload={handleUploadBoardingPass}
        uploading={uploading}
      />

      <BoardingPassOverlay
        isOpen={boardingPassOpen}
        onClose={() => setBoardingPassOpen(false)}
        passenger={myFlightPass}
        user={user}
      />
    </div>
  );
}

function FlightCard({ flight, members, approvedMembers, canEdit, onEdit }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/40">
            <Plane size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">
              {flight.provider} — {flight.flightNo}
            </h3>
            <p className="text-sm opacity-70">PNR: {flight.pnr || '—'}</p>
          </div>
        </div>
        {canEdit && <EditButton onClick={onEdit} />}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReadOnlyField label="Departure" value={formatDateTime(flight.departureTime)} />
        <ReadOnlyField label="Arrival" value={formatDateTime(flight.arrivalTime)} />
        <ReadOnlyField label="Details" value={flight.details} />
        <ReadOnlyField label="Notes" value={flight.notes} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide opacity-60">Passengers</p>
        <div className="space-y-2">
          {approvedMembers.map((uid) => {
            const passenger = (flight.passengers || []).find((p) => p.uid === uid);
            return (
              <div
                key={uid}
                className="flex items-center justify-between rounded-lg border border-inherit px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <User size={16} className="opacity-50" />
                  <span>{getMemberDisplayName(members, uid)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">
                    Seat {passenger?.seatNo || '—'}
                  </span>
                  {passenger?.boardingPassUrl && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Pass uploaded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlightEditModal({ isOpen, onClose, flight, approvedMembers, members, onSave, onUpload, uploading }) {
  const [form, setForm] = useState({
    id: '',
    provider: '',
    flightNo: '',
    pnr: '',
    departureTime: '',
    arrivalTime: '',
    details: '',
    notes: '',
    passengers: [],
  });

  useEffect(() => {
    if (flight) {
      setForm({
        id: flight.id,
        provider: flight.provider || '',
        flightNo: flight.flightNo || '',
        pnr: flight.pnr || '',
        departureTime: flight.departureTime ? flight.departureTime.slice(0, 16) : '',
        arrivalTime: flight.arrivalTime ? flight.arrivalTime.slice(0, 16) : '',
        details: flight.details || '',
        notes: flight.notes || '',
        passengers: flight.passengers || [],
      });
    } else {
      setForm({
        id: generateId(),
        provider: '',
        flightNo: '',
        pnr: '',
        departureTime: '',
        arrivalTime: '',
        details: '',
        notes: '',
        passengers: [],
      });
    }
  }, [flight, isOpen]);

  const updatePassenger = (uid, field, value) => {
    setForm((prev) => {
      const passengers = [...prev.passengers];
      const idx = passengers.findIndex((p) => p.uid === uid);
      if (idx >= 0) {
        passengers[idx] = { ...passengers[idx], [field]: value };
      } else {
        passengers.push({ uid, seatNo: field === 'seatNo' ? value : '', boardingPassUrl: '' });
      }
      return { ...prev, passengers };
    });
  };

  const getPassenger = (uid) => form.passengers.find((p) => p.uid === uid) || { uid, seatNo: '', boardingPassUrl: '' };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      departureTime: form.departureTime ? new Date(form.departureTime).toISOString() : '',
      arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : '',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={flight ? 'Edit Flight' : 'Add Flight'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Airline</label>
            <input
              className="input-field"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Flight #</label>
            <input
              className="input-field"
              value={form.flightNo}
              onChange={(e) => setForm({ ...form, flightNo: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">PNR</label>
            <input
              className="input-field"
              value={form.pnr}
              onChange={(e) => setForm({ ...form, pnr: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Departure</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Arrival</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.arrivalTime}
              onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Details</label>
            <input
              className="input-field"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            className="input-field min-h-[80px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Passenger Assignments</p>
          <div className="space-y-3">
            {approvedMembers.map((uid) => {
              const passenger = getPassenger(uid);
              return (
                <div key={uid} className="rounded-lg border border-inherit p-3">
                  <p className="mb-2 text-sm font-medium">{getMemberDisplayName(members, uid)}</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[120px]">
                      <label className="mb-1 block text-xs opacity-70">Seat Number</label>
                      <input
                        className="input-field"
                        value={passenger.seatNo}
                        onChange={(e) => updatePassenger(uid, 'seatNo', e.target.value)}
                        placeholder="e.g. 12A"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs opacity-70">Boarding Pass</label>
                      <label className="btn-secondary cursor-pointer !py-2">
                        <Upload size={14} />
                        {uploading ? 'Uploading…' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(form.id, uid, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Flight
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BoardingPassOverlay({ isOpen, onClose, passenger, user }) {
  if (!isOpen || !passenger) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold">My Boarding Pass</h2>
        <button
          onClick={onClose}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium"
        >
          Close
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <p className="mb-2 text-sm uppercase tracking-widest opacity-70">Seat Number</p>
        <p className="mb-8 text-6xl font-black tracking-tight">
          {passenger.seatNo || '—'}
        </p>

        <p className="mb-2 text-sm uppercase tracking-widest opacity-70">
          {passenger.flight?.provider} {passenger.flight?.flightNo}
        </p>
        <p className="mb-6 text-lg">{user?.displayName || user?.email}</p>

        {passenger.boardingPassUrl ? (
          <div className="w-full max-w-sm rounded-xl bg-white p-4">
            <img
              src={passenger.boardingPassUrl}
              alt="Boarding pass barcode"
              className="w-full object-contain"
            />
          </div>
        ) : (
          <p className="text-center opacity-60">No boarding pass image uploaded yet.</p>
        )}

        <p className="mt-8 text-center text-xs opacity-50">
          Show this screen at the airport gate for scanning
        </p>
      </div>
    </div>
  );
}
