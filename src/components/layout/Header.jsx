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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-950/75 no-print">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100/80 px-3 py-1 text-lg font-bold tracking-tight text-slate-900 shadow-sm shadow-slate-900/5 dark:bg-slate-800/80 dark:text-slate-100">
            ✈ Travel Planner
          </span>
          {role && (
            <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
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
        <div className="flex gap-2 pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-4 py-2.5 text-sm font-medium transition duration-200 ${
                activeTab === id
                  ? 'tab-active'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
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
