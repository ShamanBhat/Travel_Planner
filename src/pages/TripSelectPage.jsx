import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Plus, KeyRound, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { generateTripCode, generateId } from '../utils/dates';
import { formatDate } from '../utils/dates';

export default function TripSelectPage({ onSelectTrip }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [newTrip, setNewTrip] = useState({
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    lat: '',
    lng: '',
  });

  useEffect(() => {
    if (!user) return;
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'trips'), where(`members.${user.uid}.status`, 'in', ['approved', 'pending']));
      const snap = await getDocs(q);
      setTrips(snap.docs.map((d) => ({ tripId: d.id, ...d.data() })));
    } catch {
      const allSnap = await getDocs(collection(db, 'trips'));
      const filtered = allSnap.docs
        .map((d) => ({ tripId: d.id, ...d.data() }))
        .filter((t) => t.members?.[user.uid]);
      setTrips(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Trip code must be 6 characters.');
      return;
    }

    const q = query(collection(db, 'trips'), where('tripCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) {
      setError('Invalid trip code.');
      return;
    }

    const tripDoc = snap.docs[0];
    const tripData = tripDoc.data();
    if (tripData.members?.[user.uid]) {
      onSelectTrip(tripDoc.id);
      return;
    }

    await updateDoc(doc(db, 'trips', tripDoc.id), {
      [`members.${user.uid}`]: { role: 'viewer', status: 'pending' },
    });
    onSelectTrip(tripDoc.id);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const tripId = generateId();
      const tripCode = generateTripCode();
      await setDoc(doc(db, 'trips', tripId), {
        tripId,
        tripName: newTrip.tripName,
        destination: newTrip.destination,
        destCoords: {
          lat: parseFloat(newTrip.lat) || 0,
          lng: parseFloat(newTrip.lng) || 0,
        },
        tripCode,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        members: {
          [user.uid]: { role: 'admin', status: 'approved' },
        },
      });
      onSelectTrip(tripId);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Your Trips</h1>
        <p className="mt-1 text-sm opacity-60">Select a trip or join with a code</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleJoin} className="card flex gap-2">
        <div className="relative flex-1">
          <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            className="input-field pl-9 uppercase tracking-widest"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="6-char code"
            maxLength={6}
          />
        </div>
        <button type="submit" className="btn-primary">
          Join
        </button>
      </form>

      <button onClick={() => setShowCreate(!showCreate)} className="btn-secondary w-full">
        <Plus size={18} />
        Create New Trip
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Trip Name</label>
            <input className="input-field" value={newTrip.tripName} onChange={(e) => setNewTrip({ ...newTrip, tripName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Destination</label>
            <input className="input-field" value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input type="date" className="input-field" value={newTrip.startDate} onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input type="date" className="input-field" value={newTrip.endDate} onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Latitude</label>
              <input type="number" step="any" className="input-field" value={newTrip.lat} onChange={(e) => setNewTrip({ ...newTrip, lat: e.target.value })} placeholder="28.6139" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Longitude</label>
              <input type="number" step="any" className="input-field" value={newTrip.lng} onChange={(e) => setNewTrip({ ...newTrip, lng: e.target.value })} placeholder="77.2090" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary w-full">
            {creating ? 'Creating…' : 'Create Trip'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
        </div>
      ) : trips.length === 0 ? (
        <p className="text-center text-sm opacity-60">No trips yet. Create one or join with a code.</p>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => {
            const member = trip.members?.[user.uid];
            return (
              <button
                key={trip.tripId}
                onClick={() => onSelectTrip(trip.tripId)}
                className="card w-full text-left transition-opacity hover:opacity-80"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{trip.tripName}</p>
                    <p className="flex items-center gap-1 text-sm opacity-60">
                      <MapPin size={14} />
                      {trip.destination}
                    </p>
                    {trip.startDate && (
                      <p className="flex items-center gap-1 text-xs opacity-50">
                        <Calendar size={12} />
                        {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                      </p>
                    )}
                    {member?.status === 'pending' && (
                      <span className="mt-1 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
                        Pending approval
                      </span>
                    )}
                  </div>
                  <ArrowRight size={18} className="opacity-40" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
