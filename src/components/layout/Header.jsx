import {
  Plane,
  Calendar,
  Backpack,
  DollarSign,
  Map,
  Sun,
  Moon,
  Trees,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTrip } from '../../context/TripContext';
import { roleLabel } from '../../utils/roles';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Sun },
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'logistics', label: 'Logistics', icon: Plane },
  { id: 'packing', label: 'Packing', icon: Backpack },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
  { id: 'maps', label: 'Maps', icon: Map },
];

const THEME_ICONS = { light: Sun, dark: Moon, outdoor: Trees };

export default function Header({ activeTab, onTabChange, onSettings, onMembers }) {
  const { theme, cycleTheme, themeLabel } = useTheme();
  const { logout } = useAuth();
  const { getMemberRole } = useTrip();
  const ThemeIcon = THEME_ICONS[theme] || Sun;
  const role = getMemberRole();

  return (
    <header className="sticky top-0 z-40 border-b border-inherit bg-inherit/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">✈ Travel Planner</span>
          {role && (
            <span className="rounded-full bg-inherit px-2 py-0.5 text-xs opacity-60 border border-inherit">
              {roleLabel(role)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={cycleTheme} className="rounded-lg p-2 opacity-70 hover:opacity-100" title={`Theme: ${themeLabel[theme]}`}>
            <ThemeIcon size={18} />
          </button>
          {role === 'admin' && (
            <button onClick={onMembers} className="rounded-lg p-2 opacity-70 hover:opacity-100" title="Members">
              <Users size={18} />
            </button>
          )}
          <button onClick={onSettings} className="rounded-lg p-2 opacity-70 hover:opacity-100" title="Settings">
            <Settings size={18} />
          </button>
          <button onClick={logout} className="rounded-lg p-2 opacity-70 hover:opacity-100" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <nav className="mx-auto max-w-4xl overflow-x-auto px-4">
        <div className="flex gap-1 pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id ? 'tab-active' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

export { TABS };
