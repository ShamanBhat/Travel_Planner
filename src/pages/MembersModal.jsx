import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTrip } from '../context/TripContext';
import { getMemberDisplayName, roleLabel } from '../utils/roles';
import Modal from '../components/ui/Modal';

export default function MembersModal({ isOpen, onClose }) {
  const { trip, tripId, isAdmin } = useTrip();
  const [updating, setUpdating] = useState(null);

  if (!isOpen || !trip) return null;

  const members = Object.entries(trip.members || {});

  const handleApprove = async (uid, role = 'viewer') => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        [`members.${uid}`]: { role, status: 'approved' },
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleRoleChange = async (uid, role) => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        [`members.${uid}.role`]: role,
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (uid) => {
    if (!confirm('Remove this member?')) return;
    setUpdating(uid);
    try {
      const updated = { ...trip.members };
      delete updated[uid];
      await updateDoc(doc(db, 'trips', tripId), { members: updated });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Members" size="lg">
      <div className="mb-4 rounded-lg bg-inherit p-3 text-center">
        <p className="text-xs uppercase opacity-60">Trip Code</p>
        <p className="text-2xl font-mono font-bold tracking-[0.3em]">{trip.tripCode}</p>
      </div>

      <div className="space-y-3">
        {members.map(([uid, member]) => (
          <div key={uid} className="flex flex-wrap items-center gap-2 rounded-lg border border-inherit p-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{getMemberDisplayName(trip.members, uid)}</p>
              <p className="text-xs opacity-60">
                {roleLabel(member.role)} · {member.status}
              </p>
            </div>

            {isAdmin() && uid !== trip.createdBy && (
              <div className="flex flex-wrap gap-1">
                {member.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(uid, 'viewer')}
                      disabled={updating === uid}
                      className="btn-primary !px-2 !py-1 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(uid)}
                      disabled={updating === uid}
                      className="btn-secondary !px-2 !py-1 text-xs text-red-500"
                    >
                      Reject
                    </button>
                  </>
                )}
                {member.status === 'approved' && (
                  <select
                    className="input-field !w-auto !py-1 text-xs"
                    value={member.role}
                    onChange={(e) => handleRoleChange(uid, e.target.value)}
                    disabled={updating === uid}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TripSettingsModal({ isOpen, onClose }) {
  const { trip, tripId, canEdit } = useTrip();
  const [form, setForm] = useState({
    tripName: trip?.tripName || '',
    destination: trip?.destination || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    lat: trip?.destCoords?.lat?.toString() || '',
    lng: trip?.destCoords?.lng?.toString() || '',
  });

  useEffect(() => {
    if (isOpen && trip) {
      setForm({
        tripName: trip.tripName || '',
        destination: trip.destination || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        lat: trip.destCoords?.lat?.toString() || '',
        lng: trip.destCoords?.lng?.toString() || '',
      });
    }
  }, [isOpen, trip]);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'trips', tripId), {
      tripName: form.tripName,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      destCoords: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 },
    });
    onClose();
  };

  if (!canEdit()) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Trip Info">
        <div className="space-y-2 text-sm">
          <p><strong>Name:</strong> {trip?.tripName}</p>
          <p><strong>Destination:</strong> {trip?.destination}</p>
          <p><strong>Code:</strong> {trip?.tripCode}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Settings">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Trip Name</label>
          <input className="input-field" value={form.tripName} onChange={(e) => setForm({ ...form, tripName: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Destination</label>
          <input className="input-field" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Start</label>
            <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End</label>
            <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input type="number" step="any" className="input-field" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input type="number" step="any" className="input-field" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export { TripSettingsModal };
