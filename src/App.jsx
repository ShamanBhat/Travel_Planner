import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import LoginPage from './pages/LoginPage';
import TripSelectPage from './pages/TripSelectPage';
import TripDashboard from './pages/TripDashboard';
import { LoadingSpinner } from './components/ui/ReadOnlyField';

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedTripId, setSelectedTripId] = useState(
    () => localStorage.getItem('travel-planner-trip-id') || null
  );

  const handleSelectTrip = (tripId) => {
    setSelectedTripId(tripId);
    if (tripId) {
      localStorage.setItem('travel-planner-trip-id', tripId);
    } else {
      localStorage.removeItem('travel-planner-trip-id');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!selectedTripId) {
    return <TripSelectPage onSelectTrip={handleSelectTrip} />;
  }

  return (
    <TripProvider tripId={selectedTripId}>
      <TripDashboard onBack={() => handleSelectTrip(null)} />
    </TripProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
