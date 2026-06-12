import { useState } from 'react';
import { Leaf, LayoutDashboard, MapPin, Users, LogOut, Menu, X, ChevronDown, BarChart2, FileText, Settings, HelpCircle, } from 'lucide-react';

interface NavbarProps {
  user: any;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Navbar({ user, currentPage, onNavigate, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const adminLinks = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'menu' },
  { id: 'fields',    label: 'Fields',    icon: MapPin,           section: 'menu' },
  { id: 'agents',    label: 'Agents',    icon: Users,            section: 'menu' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2,        section: 'reports' },
  { id: 'reports',   label: 'Reports',   icon: FileText,         section: 'reports' },
  { id: 'settings',  label: 'Settings',  icon: Settings,         section: 'system' },
  { id: 'help',      label: 'Help',      icon: HelpCircle,       section: 'system' },
  ];

  const agentLinks = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'menu' },
  { id: 'my fields', label: 'My Fields', icon: MapPin,          section: 'menu' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2,        section: 'reports' },
  { id: 'reports',   label: 'Reports',   icon: FileText,         section: 'reports' },
  { id: 'settings',  label: 'Settings',  icon: Settings,         section: 'system' },
  { id: 'help',      label: 'Help',      icon: HelpCircle,       section: 'system' },
  ];

  const links = isAdmin ? adminLinks : agentLinks;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Nav Links */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors"
            >
              <div className="bg-green-700 rounded-lg p-1.5">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Smart<span className="text-green-700">Season</span>
              </span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              {links.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === id
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* User Menu (desktop) */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-semibold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === id
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-200 mt-2">
            <button
              onClick={() => { setMobileOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}