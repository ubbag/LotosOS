import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  Users,
  Calendar,
  Package,
  Ticket,
  Settings,
  MessageSquare,
  LayoutDashboard,
  CalendarDays,
  UserCog,
  DoorOpen,
  Sparkles,
  Tags,
  Flower2,
  LogOut,
  BarChart3,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  group: 'core' | 'resources' | 'sales' | 'admin';
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'core' },
  { label: 'Klienci', path: '/klienci', icon: Users, group: 'core' },
  { label: 'Rezerwacje', path: '/rezerwacje', icon: CalendarClock, group: 'core' },
  { label: 'Harmonogram', path: '/harmonogram', icon: CalendarDays, group: 'core' },
  { label: 'Grafik Pracy', path: '/grafik', icon: Clock, group: 'core' },
  { label: 'Pracownicy', path: '/pracownicy', icon: UserCog, group: 'resources' },
  { label: 'Gabinety', path: '/gabinety', icon: DoorOpen, group: 'resources' },
  { label: 'Usługi', path: '/uslugi', icon: Sparkles, group: 'resources' },
  { label: 'Kategorie', path: '/kategorie', icon: Tags, group: 'resources' },
  { label: 'Pakiety', path: '/pakiety', icon: Package, group: 'sales' },
  { label: 'Vouchery', path: '/vouchery', icon: Ticket, group: 'sales' },
  {
    label: 'Raporty',
    path: '/raporty',
    icon: BarChart3,
    roles: ['MANAGER', 'WLASCICIEL'],
    group: 'admin',
  },
  { label: 'SMS', path: '/sms', icon: MessageSquare, group: 'admin' },
  { label: 'Ustawienia', path: '/ustawienia', icon: Settings, group: 'admin' },
];

const groupLabels = {
  core: 'Operacyjne',
  resources: 'Zasoby',
  sales: 'Sprzedaż',
  admin: 'Administracja',
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.rola || '');
  });

  const groupedItems = {
    core: visibleItems.filter((item) => item.group === 'core'),
    resources: visibleItems.filter((item) => item.group === 'resources'),
    sales: visibleItems.filter((item) => item.group === 'sales'),
    admin: visibleItems.filter((item) => item.group === 'admin'),
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed lg:static flex flex-col z-40">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-blue-900/50">
          <Flower2 className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Lotos SPA</h1>
          <p className="text-xs text-gray-400">System Zarządzania</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        {(Object.keys(groupedItems) as Array<keyof typeof groupedItems>).map((groupKey) => {
          const items = groupedItems[groupKey];
          if (items.length === 0) return null;

          return (
            <div key={groupKey} className="mb-6">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {groupLabels[groupKey]}
              </p>
              <nav className="">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1',
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Wyloguj się</span>
        </button>
      </div>
    </aside>
  );
};
