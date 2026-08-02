import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreCollection(collectionPath, enabled = true) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !collectionPath) {
      setDocs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = collection(db, collectionPath);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocs(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionPath, enabled]);

  return { docs, loading, error };
}
