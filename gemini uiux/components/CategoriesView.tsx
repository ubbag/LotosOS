import React, { useState, useEffect } from 'react';
import { Tags, Edit2, Trash2, GripVertical, Plus } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Category } from '../types';
import { ViewToggle } from './ui/ViewToggle';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

export const CategoriesView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        order: 1,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await fetchCategories();
            // Transform API data to match component structure
            const transformedData = data.map((kategoria: any) => ({
                id: kategoria.id,
                name: kategoria.nazwa,
                serviceCount: kategoria.uslugi?.length || 0,
                order: kategoria.kolejnosc || 0,
            }));
            setCategories(transformedData);
        } catch (err) {
            setError('Nie udało się pobrać listy kategorii.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                order: category.order,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                order: categories.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('Nazwa jest wymagana');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                nazwa: formData.name,
                kolejnosc: formData.order,
            };

            if (editingCategory) {
                await updateCategory(editingCategory.id, payload);
            } else {
                await createCategory(payload);
            }

            await loadCategories();
            setIsModalOpen(false);
            setFormData({ name: '', order: 1 });
            setEditingCategory(null);
        } catch (err: any) {
            console.error('Error saving category:', err);
            alert(err.response?.data?.message || 'Nie udało się zapisać kategorii');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Czy na pewno chcesz usunąć kategorię ${name}?`)) {
            return;
        }

        try {
            await deleteCategory(id);
            await loadCategories();
        } catch (err: any) {
            console.error('Error deleting category:', err);
            alert(err.response?.data?.message || 'Nie udało się usunąć kategorii');
        }
    };

    if (loading) return <div className="p-8 text-center">Ładowanie kategorii...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Kategorie Usług</h1>
                    <p className="text-gray-500 mt-1">Struktura oferty w cenniku</p>
                </div>
                <div className="flex gap-3 items-center">
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <Button icon={Plus} onClick={() => handleOpenModal()}>Nowa Kategoria</Button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => (
                        <Card key={cat.id} className="hover:-translate-y-1 transition-transform">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                    <Tags size={24} />
                                </div>
                                <div className="text-gray-300 hover:text-gray-500 cursor-move">
                                    <GripVertical size={20} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <Badge variant="neutral">{cat.serviceCount} usług</Badge>
                                <span className="text-xs text-gray-400">Kolejność: #{cat.order}</span>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                                <Button variant="ghost" size="sm" className="flex-1 hover:bg-blue-50 hover:text-blue-600" icon={Edit2} onClick={() => handleOpenModal(cat)}>
                                    Edytuj
                                </Button>
                                <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => handleDelete(cat.id, cat.name)}>
                                    Usuń
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card noPadding className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4 border-b border-blue-100 w-12">#</th>
                                <th className="px-6 py-4 border-b border-blue-100">Nazwa Kategorii</th>
                                <th className="px-6 py-4 border-b border-blue-100">Ilość Usług</th>
                                <th className="px-6 py-4 border-b border-blue-100">Kolejność</th>
                                <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 text-gray-400 cursor-move"><GripVertical size={16} /></td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="neutral">{cat.serviceCount} usług</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">#{cat.order}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" icon={Edit2} title="Edytuj" onClick={() => handleOpenModal(cat)} />
                                            <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" onClick={() => handleDelete(cat.id, cat.name)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? "Edytuj Kategorię" : "Nowa Kategoria"}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa Kategorii *</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="np. Masaże Relaksacyjne"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kolejność</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};