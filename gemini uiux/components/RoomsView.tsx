import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DoorOpen } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Room } from '../types';
import { ViewToggle } from './ui/ViewToggle';
import { fetchRooms, createRoom, updateRoom } from '../services/api';

export const RoomsView: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    const [formData, setFormData] = useState({
        number: '',
        name: '',
        notes: '',
        active: true,
    });

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const data = await fetchRooms();
            // Transform API data to match component structure
            const transformedData = data.map((gabinet: any) => ({
                id: gabinet.id,
                number: gabinet.numer,
                name: gabinet.nazwa,
                notes: gabinet.notatki || '',
                status: gabinet.aktywny ? 'ACTIVE' : 'INACTIVE'
            }));
            setRooms(transformedData);
        } catch (err) {
            setError('Nie udało się pobrać listy gabinetów.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (room?: Room) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                number: room.number,
                name: room.name,
                notes: room.notes || '',
                active: room.status === 'ACTIVE',
            });
        } else {
            setEditingRoom(null);
            setFormData({
                number: '',
                name: '',
                notes: '',
                active: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.number.trim() || !formData.name.trim()) {
            alert('Numer i nazwa są wymagane');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                numer: formData.number,
                nazwa: formData.name,
                notatki: formData.notes,
                ...(editingRoom && { aktywny: formData.active }),
            };

            if (editingRoom) {
                await updateRoom(editingRoom.id, payload);
            } else {
                await createRoom(payload);
            }

            await loadRooms();
            setIsModalOpen(false);
            setFormData({ number: '', name: '', notes: '', active: true });
            setEditingRoom(null);
        } catch (err: any) {
            console.error('Error saving room:', err);
            alert(err.response?.data?.message || 'Nie udało się zapisać gabinetu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Ładowanie gabinetów...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gabinety</h1>
                    <p className="text-gray-500 mt-1">Zarządzanie pomieszczeniami zabiegowymi</p>
                </div>
                <div className="flex gap-3 items-center">
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <Button icon={Plus} onClick={() => handleOpenModal()}>Dodaj Gabinet</Button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <Card noPadding className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4 border-b border-blue-100">Numer</th>
                                <th className="px-6 py-4 border-b border-blue-100">Nazwa Gabinetu</th>
                                <th className="px-6 py-4 border-b border-blue-100">Wyposażenie / Notatki</th>
                                <th className="px-6 py-4 border-b border-blue-100">Status</th>
                                <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rooms.map(room => (
                                <tr key={room.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-600 font-bold">{room.number}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                                        <DoorOpen size={16} className="text-blue-500"/>
                                        {room.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{room.notes}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={room.status === 'ACTIVE' ? 'active' : 'neutral'}>
                                            {room.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" icon={Edit2} title="Edytuj" onClick={() => handleOpenModal(room)} />
                                            <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" disabled />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map(room => (
                        <Card key={room.id}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold text-lg font-mono">
                                        {room.number}
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                                </div>
                                <Badge variant={room.status === 'ACTIVE' ? 'active' : 'neutral'}>
                                    {room.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                                </Badge>
                            </div>

                            <div className="mb-6 bg-gray-50 p-3 rounded-lg text-sm text-gray-600 min-h-[60px]">
                                <p className="font-semibold text-gray-500 mb-1 text-xs uppercase">Wyposażenie</p>
                                {room.notes}
                            </div>

                            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                                <Button variant="ghost" size="sm" className="flex-1" icon={Edit2} onClick={() => handleOpenModal(room)}>Edytuj</Button>
                                <Button variant="danger-ghost" size="sm" className="flex-1" icon={Trash2} disabled>Usuń</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRoom ? "Edytuj Gabinet" : "Dodaj Gabinet"}
                footer={
                <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>Anuluj</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Zapisywanie...' : 'Zapisz'}
                    </Button>
                </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numer *</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="101"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Gabinet Lotos"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notatki / Wyposażenie</label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                            placeholder="Opis wyposażenia..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    {editingRoom && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="activeRoom"
                                className="rounded text-blue-600 focus:ring-blue-500"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            />
                            <label htmlFor="activeRoom" className="text-sm text-gray-700">Gabinet aktywny</label>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};