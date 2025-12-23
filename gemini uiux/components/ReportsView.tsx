import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Download, DollarSign, Activity } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatCardProps } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const revenueData = [
  { name: '01.05', value: 1200 },
  { name: '02.05', value: 1500 },
  { name: '03.05', value: 1800 },
  { name: '04.05', value: 1400 },
  { name: '05.05', value: 2000 },
  { name: '06.05', value: 2200 },
  { name: '07.05', value: 1900 },
];

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon: Icon }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-xs text-green-600 font-medium">{subtext}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
        <Icon size={20} />
      </div>
    </div>
  );

export const ReportsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'revenue' | 'services' | 'staff'>('revenue');

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Raporty</h1>
                    <p className="text-gray-500 mt-1">Analityka finansowa i operacyjna</p>
                </div>
                
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 p-1">
                        <input type="date" className="text-sm outline-none text-gray-600" />
                        <span className="text-gray-400">-</span>
                        <input type="date" className="text-sm outline-none text-gray-600" />
                    </div>
                    <Button icon={Download} variant="secondary">Eksport PDF</Button>
                </div>
            </div>

            <div className="border-b border-gray-200 flex gap-6">
                <button 
                    onClick={() => setActiveTab('revenue')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'revenue' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Raport Utargu
                    {activeTab === 'revenue' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('services')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'services' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Statystyki Usług
                    {activeTab === 'services' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('staff')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'staff' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Wydajność Pracowników
                    {activeTab === 'staff' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <Card>
                        <div className="grid grid-cols-3 gap-8 mb-8 border-b border-gray-100 pb-8">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-1">Całkowity Przychód</p>
                                <p className="text-3xl font-bold text-gray-900">12,450 PLN</p>
                            </div>
                            <div className="text-center border-l border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Średnia Dzienna</p>
                                <p className="text-3xl font-bold text-gray-900">1,778 PLN</p>
                            </div>
                            <div className="text-center border-l border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Liczba Paragonów</p>
                                <p className="text-3xl font-bold text-gray-900">45</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                                    <Tooltip cursor={{fill: '#EFF6FF'}} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                                    <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card noPadding>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-700 text-xs font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-200">Data</th>
                                    <th className="px-6 py-3 border-b border-gray-200">Liczba Wizyt</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right">Utarg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {revenueData.map((day, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-900 font-medium">{day.name}.2024</td>
                                        <td className="px-6 py-3 text-gray-600">{Math.floor(day.value / 150)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-blue-600">{day.value} PLN</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="flex items-center justify-center h-64 text-gray-500">Widok statystyk usług...</div>
            )}
            
            {activeTab === 'staff' && (
                <div className="flex items-center justify-center h-64 text-gray-500">Widok wydajności pracowników...</div>
            )}
        </div>
    );
};