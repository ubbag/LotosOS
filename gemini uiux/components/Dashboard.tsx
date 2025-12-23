import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowRight,
  Ticket
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { StatCardProps } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDashboardStats, fetchHourlyStats, fetchMonthlyStats } from '../services/api';

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

const AppointmentRow = ({ time, name, service, status }: { time: string, name: string, service: string, status: 'active' | 'completed' | 'pending' }) => {
    const statusMap = {
        active: 'active',
        completed: 'success',
        pending: 'warning'
    } as const;

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
            <Badge variant={statusMap[status]}>
                {status === 'active' ? 'W TRAKCIE' : status === 'completed' ? 'ZAKOŃCZONA' : 'OCZEKUJE'}
            </Badge>
        </div>
    );
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'7days' | 'today' | 'month'>('7days');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
        setChartData(data.dailyVisits);
      } catch (err) {
        setError('Nie udało się pobrać statystyk.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const handleChartViewChange = async (view: '7days' | 'today' | 'month') => {
    setChartView(view);
    if (view === 'today') {
      try {
        const hourlyData = await fetchHourlyStats();
        setChartData(hourlyData.hourlyVisits);
      } catch (err) {
        console.error('Error fetching hourly stats:', err);
      }
    } else if (view === 'month') {
      try {
        const monthlyData = await fetchMonthlyStats();
        setChartData(monthlyData.monthlyVisits);
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
      }
    } else {
      setChartData(stats?.dailyVisits || []);
    }
  };

  const mapStatusToFrontend = (status: string): 'active' | 'completed' | 'pending' => {
    switch (status) {
      case 'POTWIERDZONA':
        return 'active';
      case 'ZAKONCZONA':
        return 'completed';
      case 'OCZEKUJACA':
      case 'ANULOWANA':
      default:
        return 'pending';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' zł';
  };

  if (loading) return <div className="p-8 text-center">Ładowanie dashboardu...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!stats) return <div className="p-8 text-center">Brak danych</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
             <Button variant="secondary" icon={Clock}>Grafik</Button>
             <Button variant="primary" icon={Calendar}>Nowa Rezerwacja</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Dzisiejsze Wizyty"
          value={stats.rezerwacjeDzisTotal.toString()}
          subtext={`${stats.visitChangePercent > 0 ? '+' : ''}${stats.visitChangePercent}% wczoraj`}
          icon={Calendar}
        />
        <StatCard
          label="Aktywni Klienci"
          value={stats.klienciTotal.toString()}
          subtext={`+${stats.noviKlienciMiesiac} w tym miesiącu`}
          icon={Users}
        />
        <StatCard
          label="Przychód (Miesięczny)"
          value={formatCurrency(stats.utargMiesiac)}
          subtext={`${stats.revenueChangePercent > 0 ? '+' : ''}${stats.revenueChangePercent}% poprzedni msc`}
          icon={CreditCard}
        />
        <StatCard
          label="Sprzedaż Voucherów"
          value={stats.voucherySprzedaneMiesiac.toString()}
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
                    <select
                        className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        value={chartView}
                        onChange={(e) => handleChartViewChange(e.target.value as '7days' | 'today' | 'month')}
                    >
                        <option value="today">Dziś (godzinowo)</option>
                        <option value="7days">Ostatnie 7 dni</option>
                        <option value="month">Miesiąc</option>
                    </select>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} allowDecimals={false} />
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
            <Card className="h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Dzisiejsze wizyty</h3>
                    <Button variant="ghost" size="sm">Zobacz wszystkie</Button>
                </div>
                <div className="flex flex-col gap-1">
                    {stats.todayAppointments.length > 0 ? (
                      stats.todayAppointments.map((apt: any) => (
                        <AppointmentRow
                          key={apt.id}
                          time={apt.time}
                          name={apt.clientName}
                          service={apt.serviceName}
                          status={mapStatusToFrontend(apt.status)}
                        />
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Brak wizyt na dzisiaj</p>
                    )}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100">
                     <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Przejdź do kalendarza <ArrowRight size={16} className="ml-2" />
                     </Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};