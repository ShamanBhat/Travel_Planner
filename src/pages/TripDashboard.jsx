import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import Header from '../components/layout/Header';
import { TripHeader } from '../components/layout/CountdownTimer';
import WeatherWidget from '../components/WeatherWidget';
import Itinerary from '../components/Itinerary';
import Logistics from '../components/Logistics';
import PackingList from '../components/PackingList';
import ExpenseTracker from '../components/ExpenseTracker';
import MapHub from '../components/MapHub';
import MembersModal, { TripSettingsModal } from './MembersModal';
import { LoadingSpinner } from '../components/ui/ReadOnlyField';

export default function TripDashboard({ onBack }) {
  const { trip, loading, error, isApprovedMember } = useTrip();
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-500">{error || 'Trip not found'}</p>
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} />
          Back to Trips
        </button>
      </div>
    );
  }

  if (!isApprovedMember()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="card max-w-md text-center">
          <h2 className="text-lg font-bold">Awaiting Approval</h2>
          <p className="mt-2 text-sm opacity-70">
            Your request to join <strong>{trip.tripName}</strong> is pending admin approval.
          </p>
          <p className="mt-2 text-xs opacity-50">Trip code: {trip.tripCode}</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} />
          Back to Trips
        </button>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <TripHeader trip={trip} onPrint={handlePrint} />
            <WeatherWidget />
          </div>
        );
      case 'itinerary':
        return <Itinerary />;
      case 'logistics':
        return <Logistics />;
      case 'packing':
        return <PackingList />;
      case 'expenses':
        return <ExpenseTracker />;
      case 'maps':
        return <MapHub />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettings={() => setSettingsOpen(true)}
        onMembers={() => setMembersOpen(true)}
      />

      <main className="mx-auto max-w-4xl px-4 py-4 pb-8">
        <button onClick={onBack} className="btn-secondary no-print mb-4 text-xs">
          <ArrowLeft size={14} />
          All Trips
        </button>
        {renderTab()}
      </main>

      <TripSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MembersModal isOpen={membersOpen} onClose={() => setMembersOpen(false)} />
    </div>
  );
}
