import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowRight,
  Ticket,
  Loader2,
} from 'lucide-react';
import { Layout } from '@components/Layout';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { apiClient } from '@services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  klienciTotal: number;
  rezerwacjeDzisTotal: number;
  rezerwacjeDzisPotwierdzoneTotal: number;
  pakietyAktywne: number;
  voucheryAktywne: number;
  utargDzis: number;
  utargMiesiac: number;
  visitChangePercent: number;
  revenueChangePercent: number;
  noviKlienciMiesiac: number;
  voucherySprzedaneMiesiac: number;
  voucheryDoWykorzystania: number;
  dailyVisits: Array<{ name: string; visits: number }>;
  todayAppointments: Array<{
    id: string;
    time: string;
    clientName: string;
    serviceName: string;
    status: string;
  }>;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon: Icon }) => (
  <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-6 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-xs text-blue-600 font-medium">{subtext}</p>
    </div>
    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
      <Icon size={24} />
    </div>
  </div>
);

interface AppointmentRowProps {
  time: string;
  name: string;
  service: string;
  status: string;
}

const AppointmentRow: React.FC<AppointmentRowProps> = ({ time, name, service, status }) => {
  const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'ZAKONCZONA':
        return 'success';
      case 'W_TRAKCIE':
        return 'primary';
      case 'NOWA':
        return 'warning';
      case 'POTWIERDZONA':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ZAKONCZONA':
        return 'ZAKOŃCZONA';
      case 'W_TRAKCIE':
        return 'W TRAKCIE';
      case 'NOWA':
        return 'NOWA';
      case 'POTWIERDZONA':
        return 'POTWIERDZONA';
      case 'ANULOWANA':
        return 'ANULOWANA';
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-mono font-bold text-sm">
          {time}
        </div>
        <div>
          <h4 className="font-bold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500">{service}</p>
        </div>
      </div>
      <Badge variant={getStatusVariant(status)}>
        {getStatusLabel(status)}
      </Badge>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await apiClient.get('/dashboard/stats');
        console.log('Dashboard stats response:', res.data);
        setStats(res.data.data);
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);

  const formatPercent = (percent: number) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent}%`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="text-center">
          <p>Nie udało się załadować statystyk.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Odśwież stronę
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/grafik')}>
              <Clock className="h-4 w-4 mr-2" />
              Grafik
            </Button>
            <Button onClick={() => navigate('/rezerwacje')}>
              <Calendar className="h-4 w-4 mr-2" />
              Nowa Rezerwacja
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label="Dzisiejsze Wizyty"
            value={stats.rezerwacjeDzisTotal}
            subtext={`${formatPercent(stats.visitChangePercent)} wczoraj`}
            icon={Calendar}
          />
          <StatCard
            label="Aktywni Klienci"
            value={stats.klienciTotal}
            subtext={`+${stats.noviKlienciMiesiac} w tym miesiącu`}
            icon={Users}
          />
          <StatCard
            label="Przychód (Miesięczny)"
            value={formatCurrency(stats.utargMiesiac)}
            subtext={`${formatPercent(stats.revenueChangePercent)} poprzedni msc`}
            icon={CreditCard}
          />
          <StatCard
            label="Sprzedaż Voucherów"
            value={stats.voucherySprzedaneMiesiac}
            subtext={`${stats.voucheryDoWykorzystania} do wykorzystania`}
            icon={Ticket}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500"/>
                  Statystyki Wizyt
                </h3>
                <select className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
                  <option>Ostatnie 7 dni</option>
                  <option>Ostatnie 30 dni</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyVisits}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#111827', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Recent Appointments */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Dzisiejsze wizyty</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/rezerwacje')}>
                  Zobacz wszystkie
                </Button>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                {stats.todayAppointments.length > 0 ? (
                  stats.todayAppointments.map((apt) => (
                    <AppointmentRow
                      key={apt.id}
                      time={apt.time}
                      name={apt.clientName}
                      service={apt.serviceName}
                      status={apt.status}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Brak wizyt na dzisiaj</p>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => navigate('/harmonogram')}
                >
                  Przejdź do kalendarza <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
