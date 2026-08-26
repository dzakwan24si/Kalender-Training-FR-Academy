import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Database,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  User
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Kalender Pelatihan', href: '/calendar', icon: Calendar },
    { name: 'Manajemen Data', href: '/data', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center h-20 px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 w-full">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wide leading-tight">First Resources</span>
              <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wider leading-tight">ACADEMY</span>
            </div>
          </div>
          <button className="lg:hidden text-slate-500 absolute right-4" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-green-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 text-center">
            &copy; 2026 First Resources
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="hidden sm:flex items-center relative max-w-md w-full">
              <Search className="absolute left-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari program, trainer, atau lokasi..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700">Admin Utama</span>
                <span className="text-xs text-slate-500">Super Admin</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
