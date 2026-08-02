import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const TripContext = createContext(null);

export function TripProvider({ children, tripId }) {
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const tripRef = doc(db, 'trips', tripId);
    const unsubscribe = onSnapshot(
      tripRef,
      (snap) => {
        if (snap.exists()) {
          setTrip({ tripId: snap.id, ...snap.data() });
          setError(null);
        } else {
          setTrip(null);
          setError('Trip not found');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tripId]);

  const getMemberRole = useCallback(() => {
    if (!user || !trip?.members) return null;
    const member = trip.members[user.uid];
    if (!member || member.status !== 'approved') return null;
    return member.role;
  }, [user, trip]);

  const canEdit = useCallback(() => {
    const role = getMemberRole();
    return role === 'admin' || role === 'editor';
  }, [getMemberRole]);

  const isAdmin = useCallback(() => getMemberRole() === 'admin', [getMemberRole]);

  const isApprovedMember = useCallback(() => {
    if (!user || !trip?.members) return false;
    return trip.members[user.uid]?.status === 'approved';
  }, [user, trip]);

  return (
    <TripContext.Provider
      value={{
        trip,
        tripId,
        loading,
        error,
        getMemberRole,
        canEdit,
        isAdmin,
        isApprovedMember,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
}
