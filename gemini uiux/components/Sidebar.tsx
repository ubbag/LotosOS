import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Package, 
  Tags, 
  Settings, 
  LogOut,
  Flower2,
  CalendarDays,
  UserCog,
  DoorOpen,
  MessageSquare,
  BarChart3,
  CalendarClock,
  Sparkles,
  Clock
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  activeTab: ViewState;
  setActiveTab: (tab: ViewState) => void;
  isOpen: boolean;
}

interface NavButtonProps {
  item: { id: string; label: string; icon: any };
  isActive: boolean;
  onClick?: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }
      `}
    >
      <Icon size={20} />
      <span className="font-medium">{item.label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  // Group 1: Core Operations
  const coreItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Klienci', icon: Users },
    { id: 'reservations', label: 'Rezerwacje', icon: CalendarClock },
    { id: 'schedule', label: 'Harmonogram', icon: CalendarDays },
    { id: 'roster', label: 'Grafik Pracy', icon: Clock },
  ];

  // Group 2: Resources
  const resourceItems = [
    { id: 'employees', label: 'Pracownicy', icon: UserCog },
    { id: 'rooms', label: 'Gabinety', icon: DoorOpen },
    { id: 'services', label: 'Usługi', icon: Sparkles },
    { id: 'categories', label: 'Kategorie', icon: Tags },
  ];

  // Group 3: Sales
  const salesItems = [
    { id: 'packages', label: 'Pakiety', icon: Package },
    { id: 'vouchers', label: 'Vouchery', icon: Ticket },
  ];

  // Group 4: Admin
  const adminItems = [
    { id: 'reports', label: 'Raporty', icon: BarChart3 },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'settings', label: 'Ustawienia', icon: Settings },
  ];

  return (
    <aside 
      className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 text-white transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static flex flex-col
      `}
    >
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
        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Operacyjne</p>
        <nav className="mb-6">
          {coreItems.map((item) => (
            <NavButton key={item.id} item={item} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewState)} />
          ))}
        </nav>

        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Zasoby</p>
        <nav className="mb-6">
          {resourceItems.map((item) => (
            <NavButton key={item.id} item={item} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewState)} />
          ))}
        </nav>

        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sprzedaż</p>
        <nav className="mb-6">
          {salesItems.map((item) => (
            <NavButton key={item.id} item={item} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewState)} />
          ))}
        </nav>

        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Administracja</p>
        <nav>
          {adminItems.map((item) => (
            <NavButton key={item.id} item={item} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewState)} />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Wyloguj się</span>
        </button>
      </div>
    </aside>
  );
};