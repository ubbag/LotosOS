import React, { useState } from 'react';
import { Package, Plus, CheckCircle, Clock, Edit2, Trash2, History } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Package as PackageType } from '../types';
import { ViewToggle } from './ui/ViewToggle';

const MOCK_PACKAGES: PackageType[] = [
    {
        id: '1',
        name: 'Pakiet Leczniczy 10h',
        totalHours: 10,
        usedHours: 4,
        price: 1200,
        active: true,
        color: 'bg-emerald-500'
    },
    {
        id: '2',
        name: 'Relaks Totalny 5h',
        totalHours: 5,
        usedHours: 1,
        price: 700,
        active: true,
        color: 'bg-purple-500'
    },
    {
        id: '3',
        name: 'Masaż Twarzy Kobido 3+1',
        totalHours: 4,
        usedHours: 4,
        price: 600,
        active: false,
        color: 'bg-rose-500'
    }
];

export const PackagesView: React.FC = () => {
    const [tabMode, setTabMode] = useState<'definitions' | 'purchased'>('definitions');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pakiety</h1>
                    <p className="text-gray-500 mt-1">Zarządzaj ofertą pakietową</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setTabMode('definitions')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${tabMode === 'definitions' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Oferta
                    </button>
                    <button 
                        onClick={() => setTabMode('purchased')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${tabMode === 'purchased' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Zakupione
                    </button>
                </div>
                <div className="flex gap-3 items-center">
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <Button icon={Plus}>Nowy Pakiet</Button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tabMode === 'definitions' ? (
                        // Definitions View Grid
                        MOCK_PACKAGES.map(pkg => (
                            <Card key={pkg.id}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-opacity-10 ${pkg.color.replace('bg-', 'bg-').replace('500', '100')}`}>
                                        <Package className={pkg.color.replace('bg-', 'text-')} size={28} />
                                    </div>
                                    <Badge variant="active">{pkg.price} PLN</Badge>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                                <p className="text-gray-500 text-sm mb-6">Pakiet obejmuje {pkg.totalHours} godzin zabiegów do wykorzystania w ciągu 12 miesięcy.</p>
                                
                                <div className="mt-auto space-y-3">
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <CheckCircle size={16} className="text-green-500 mr-2"/>
                                        Oszczędność ok. 15%
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="secondary" size="sm">Edytuj</Button>
                                        <Button variant="primary" size="sm">Sprzedaj</Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        // Purchased View Grid
                        MOCK_PACKAGES.map(pkg => {
                            const percent = (pkg.usedHours / pkg.totalHours) * 100;
                            return (
                                <Card key={`purchased-${pkg.id}`} className="border-l-4 border-l-purple-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                                AN
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">Anna Nowak</h4>
                                                <p className="text-xs text-gray-500">Zakupiono: 12.05.2024</p>
                                            </div>
                                        </div>
                                        <Badge variant={pkg.active ? 'active' : 'neutral'}>{pkg.active ? 'AKTYWNY' : 'ZAKOŃCZONY'}</Badge>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">{pkg.name}</h3>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 font-medium">Postęp</span>
                                            <span className="text-gray-900 font-bold">{pkg.usedHours} / {pkg.totalHours} h</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${pkg.active ? 'bg-purple-600' : 'bg-gray-400'}`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="sm" className="w-full mt-auto" icon={Clock}>
                                        Historia użycia
                                    </Button>
                                </Card>
                            )
                        })
                    )}
                </div>
            ) : (
                <Card noPadding className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        {tabMode === 'definitions' ? (
                            <>
                                <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-blue-100">Nazwa Pakietu</th>
                                        <th className="px-6 py-4 border-b border-blue-100">Liczba Godzin</th>
                                        <th className="px-6 py-4 border-b border-blue-100">Cena</th>
                                        <th className="px-6 py-4 border-b border-blue-100">Ważność</th>
                                        <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {MOCK_PACKAGES.map(pkg => (
                                        <tr key={pkg.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{pkg.name}</td>
                                            <td className="px-6 py-4">{pkg.totalHours}h</td>
                                            <td className="px-6 py-4 font-bold text-blue-600">{pkg.price} PLN</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">12 miesięcy</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="secondary" size="sm" title="Sprzedaj">Sprzedaj</Button>
                                                    <Button variant="ghost" size="sm" icon={Edit2} title="Edytuj" />
                                                    <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        ) : (
                            <>
                                <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-blue-100">Klient</th>
                                        <th className="px-6 py-4 border-b border-blue-100">Pakiet</th>
                                        <th className="px-6 py-4 border-b border-blue-100">Wykorzystanie</th>
                                        <th className="px-6 py-4 border-b border-blue-100">Status</th>
                                        <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {MOCK_PACKAGES.map(pkg => (
                                        <tr key={`list-purchased-${pkg.id}`} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">Anna Nowak</div>
                                                <div className="text-xs text-gray-500">Zakup: 12.05.2024</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">{pkg.name}</td>
                                            <td className="px-6 py-4">
                                                 <div className="text-sm font-bold text-gray-900">{pkg.usedHours} / {pkg.totalHours} h</div>
                                                 <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div 
                                                        className={`h-1.5 rounded-full ${pkg.active ? 'bg-purple-600' : 'bg-gray-400'}`} 
                                                        style={{ width: `${(pkg.usedHours / pkg.totalHours) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={pkg.active ? 'active' : 'neutral'}>{pkg.active ? 'AKTYWNY' : 'ZAKOŃCZONY'}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" icon={History}>Historia</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                    </table>
                </Card>
            )}
        </div>
    );
};