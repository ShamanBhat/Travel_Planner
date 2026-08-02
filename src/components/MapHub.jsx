import { useState, useEffect } from 'react';
import { Map, MapPin, Plus, Trash2, ExternalLink, Tent, Droplets, Mountain } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTrip } from '../context/TripContext';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { generateId } from '../utils/dates';
import Modal from './ui/Modal';
import { EditButton, EmptyState, LoadingSpinner } from './ui/ReadOnlyField';

const MAPS_DOC_ID = 'main';

const PIN_CATEGORIES = [
  { value: 'trailhead', label: 'Trailhead', icon: Mountain },
  { value: 'campsite', label: 'Campsite', icon: Tent },
  { value: 'water', label: 'Water Source', icon: Droplets },
  { value: 'other', label: 'Other', icon: MapPin },
];

export default function MapHub() {
  const { tripId, canEdit } = useTrip();
  const { data, loading } = useFirestoreDoc(`trips/${tripId}/maps`, MAPS_DOC_ID, !!tripId);
  const [editLinksOpen, setEditLinksOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const mapData = data || { gpxUrl: '', customMapUrl: '', pins: [] };
  const pins = mapData.pins || [];

  const saveMapData = async (updates) => {
    const ref = doc(db, 'trips', tripId, 'maps', MAPS_DOC_ID);
    await setDoc(ref, { ...mapData, ...updates }, { merge: true });
  };

  const handleSavePin = async (formData) => {
    const updatedPins = [...pins];
    if (formData.id && updatedPins.some((p) => p.id === formData.id)) {
      const idx = updatedPins.findIndex((p) => p.id === formData.id);
      updatedPins[idx] = formData;
    } else {
      updatedPins.push({ ...formData, id: formData.id || generateId() });
    }
    await saveMapData({ pins: updatedPins });
    setPinModalOpen(false);
    setEditingPin(null);
  };

  const handleDeletePin = async (pinId) => {
    if (!confirm('Remove this pin?')) return;
    await saveMapData({ pins: pins.filter((p) => p.id !== pinId) });
  };

  const dropPinAtLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setEditingPin(null);
        setPinModalOpen(true);
      },
      () => alert('Unable to get your location. Check permissions.')
    );
  };

  if (loading) return <LoadingSpinner />;

  const mapEmbedUrl = mapData.customMapUrl || (
    pins.length > 0
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${pins[0].longitude - 0.05},${pins[0].latitude - 0.05},${pins[0].longitude + 0.05},${pins[0].latitude + 0.05}&layer=mapnik&marker=${pins[0].latitude},${pins[0].longitude}`
      : null
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Trail Maps & Pins</h2>
        <div className="flex gap-2">
          <button onClick={dropPinAtLocation} className="btn-secondary">
            <MapPin size={16} />
            Drop GPS Pin
          </button>
          {canEdit() && (
            <>
              <button onClick={() => setEditLinksOpen(true)} className="btn-secondary">
                <Map size={16} />
                Map Links
              </button>
              <button
                onClick={() => {
                  setEditingPin(null);
                  setUserLocation(null);
                  setPinModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} />
                Add Pin
              </button>
            </>
          )}
        </div>
      </div>

      {(mapData.gpxUrl || mapData.customMapUrl) && (
        <div className="flex flex-wrap gap-2">
          {mapData.gpxUrl && (
            <a href={mapData.gpxUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
              <ExternalLink size={14} />
              GPX Track
            </a>
          )}
          {mapData.customMapUrl && (
            <a href={mapData.customMapUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
              <ExternalLink size={14} />
              Full Map
            </a>
          )}
        </div>
      )}

      {mapEmbedUrl && (
        <div className="card !p-0 overflow-hidden">
          <iframe
            title="Trip map"
            src={mapEmbedUrl}
            className="h-64 w-full border-0 sm:h-80"
            loading="lazy"
          />
        </div>
      )}

      {pins.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No map pins yet"
          description="Drop GPS pins for campsites, water sources, and trailheads."
        />
      ) : (
        <div className="space-y-2">
          {pins.map((pin) => {
            const cat = PIN_CATEGORIES.find((c) => c.value === pin.category) || PIN_CATEGORIES[3];
            const CatIcon = cat.icon;
            return (
              <div key={pin.id} className="card !p-3 flex items-center gap-3">
                <div className="rounded-full bg-inherit p-2 opacity-70">
                  <CatIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{pin.name}</p>
                  <p className="text-xs opacity-60">
                    {cat.label} · {pin.latitude?.toFixed(5)}, {pin.longitude?.toFixed(5)}
                  </p>
                  {pin.notes && <p className="mt-1 text-sm opacity-70">{pin.notes}</p>}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !px-2 !py-1.5 text-xs"
                >
                  <ExternalLink size={14} />
                </a>
                {canEdit() && (
                  <div className="flex gap-1">
                    <EditButton
                      onClick={() => {
                        setEditingPin(pin);
                        setPinModalOpen(true);
                      }}
                    />
                    <button
                      onClick={() => handleDeletePin(pin.id)}
                      className="rounded-lg p-1.5 opacity-50 hover:opacity-100 hover:text-red-500"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MapLinksModal
        isOpen={editLinksOpen}
        onClose={() => setEditLinksOpen(false)}
        gpxUrl={mapData.gpxUrl}
        customMapUrl={mapData.customMapUrl}
        onSave={(links) => {
          saveMapData(links);
          setEditLinksOpen(false);
        }}
      />

      <PinEditModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setEditingPin(null);
          setUserLocation(null);
        }}
        pin={editingPin}
        userLocation={userLocation}
        onSave={handleSavePin}
      />
    </div>
  );
}

function MapLinksModal({ isOpen, onClose, gpxUrl, customMapUrl, onSave }) {
  const [gpx, setGpx] = useState('');
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGpx(gpxUrl || '');
      setCustom(customMapUrl || '');
    }
  }, [isOpen, gpxUrl, customMapUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Map Links">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ gpxUrl: gpx, customMapUrl: custom });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">GPX Track URL</label>
          <input className="input-field" value={gpx} onChange={(e) => setGpx(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Custom Map Embed URL</label>
          <input className="input-field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

function PinEditModal({ isOpen, onClose, pin, userLocation, onSave }) {
  const [form, setForm] = useState({
    id: '', name: '', category: 'other', latitude: '', longitude: '', notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        id: pin?.id || '',
        name: pin?.name || '',
        category: pin?.category || 'other',
        latitude: pin?.latitude?.toString() || userLocation?.lat?.toString() || '',
        longitude: pin?.longitude?.toString() || userLocation?.lng?.toString() || '',
        notes: pin?.notes || '',
      });
    }
  }, [isOpen, pin, userLocation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pin ? 'Edit Pin' : 'Add Pin'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {PIN_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input type="number" step="any" className="input-field" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input type="number" step="any" className="input-field" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea className="input-field min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Save Pin</button>
        </div>
      </form>
    </Modal>
  );
}
