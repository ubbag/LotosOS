import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles, Clock } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ViewToggle } from './ui/ViewToggle';
import { fetchServices } from '../services/api';

export const ServicesView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadServices = async () => {
            try {
                const data = await fetchServices();

                // API returns grouped object by category, flatten it to array
                const uslugiArray = Object.values(data).flat();

                // Transform API data to match component structure
                const transformedData = uslugiArray.map((usluga: any) => {
                    // Get first variant for duration and price, or use defaults
                    const firstVariant = usluga.wariantyUslugi?.[0];

                    return {
                        id: usluga.id,
                        name: usluga.nazwa,
                        category: usluga.kategoria?.nazwa || 'Bez kategorii',
                        duration: firstVariant?.czasMinut || 0,
                        price: firstVariant?.cenaRegularna || 0,
                        active: usluga.aktywna
                    };
                });
                setServices(transformedData);
            } catch (err) {
                setError('Nie udało się pobrać listy usług.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadServices();
    }, []);

    if (loading) return <div className="p-8 text-center">Ładowanie usług...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Usługi</h1>
                    <p className="text-gray-500 mt-1">Katalog usług i cennik</p>
                </div>
                <div className="flex gap-3 items-center">
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <Button icon={Plus}>Nowa Usługa</Button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <Card key={service.id} className="group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Sparkles size={24} />
                                </div>
                                <Badge variant={service.active ? 'active' : 'neutral'}>
                                    {service.active ? 'AKTYWNA' : 'NIEAKTYWNA'}
                                </Badge>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{service.category}</p>

                            <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-4">
                                <div className="flex items-center text-gray-600 text-sm">
                                    <Clock size={16} className="mr-2" />
                                    {service.duration} min
                                </div>
                                <div className="font-bold text-indigo-600">
                                    {service.price} PLN
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-auto">
                                <Button variant="secondary" size="sm" className="flex-1" icon={Edit2}>Edytuj</Button>
                                <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card noPadding className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4 border-b border-blue-100">Nazwa Usługi</th>
                                <th className="px-6 py-4 border-b border-blue-100">Kategoria</th>
                                <th className="px-6 py-4 border-b border-blue-100">Czas</th>
                                <th className="px-6 py-4 border-b border-blue-100">Cena</th>
                                <th className="px-6 py-4 border-b border-blue-100">Status</th>
                                <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {services.map(service => (
                                <tr key={service.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-indigo-400" />
                                            {service.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{service.category}</td>
                                    <td className="px-6 py-4 text-sm font-mono">{service.duration} min</td>
                                    <td className="px-6 py-4 font-bold text-indigo-600">{service.price} PLN</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={service.active ? 'active' : 'neutral'}>
                                            {service.active ? 'AKTYWNA' : 'NIEAKTYWNA'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" icon={Edit2} title="Edytuj" />
                                            <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};
