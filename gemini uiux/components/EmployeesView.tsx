import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, User } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Employee } from '../types';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { ViewToggle } from './ui/ViewToggle';

export const EmployeesView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [submitting, setSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialization: '',
    active: true,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      setError('Nie udało się pobrać listy pracowników.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        specialization: employee.specialization.join(', '),
        active: employee.status === 'ACTIVE',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        specialization: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Imię i nazwisko są wymagane');
      return;
    }

    setSubmitting(true);
    try {
      const specializationArray = formData.specialization
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialization: specializationArray,
          active: formData.active,
        });
      } else {
        await createEmployee({
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialization: specializationArray,
          active: formData.active,
        });
      }

      await loadEmployees();
      setFormData({ firstName: '', lastName: '', specialization: '', active: true });
      setEditingEmployee(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving employee:', err);
      alert(err.response?.data?.message || 'Nie udało się zapisać pracownika');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć pracownika ${name}?`)) {
      return;
    }

    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      alert(err.response?.data?.message || 'Nie udało się usunąć pracownika');
    }
  };

  if (loading) return <div className="p-8 text-center">Ładowanie pracowników...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pracownicy</h1>
          <p className="text-gray-500 mt-1">Zarządzanie personelem i grafikami</p>
        </div>
        <div className="flex gap-3 items-center">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            <Button icon={Plus} onClick={() => handleOpenModal()}>Dodaj Pracownika</Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card noPadding className="overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4 border-b border-blue-100">Imię i Nazwisko</th>
                        <th className="px-6 py-4 border-b border-blue-100">Specjalizacje</th>
                        <th className="px-6 py-4 border-b border-blue-100">Status</th>
                        <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {emp.specialization.map(spec => (
                                        <span key={spec} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={emp.status === 'ACTIVE' ? 'active' : 'neutral'}>
                                    {emp.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" icon={Calendar} title="Grafik" />
                                    <Button variant="ghost" size="sm" icon={Edit2} title="Edytuj" onClick={() => handleOpenModal(emp)} />
                                    <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
                <Card key={emp.id}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</h3>
                                <Badge variant={emp.status === 'ACTIVE' ? 'active' : 'neutral'}>
                                    {emp.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Specjalizacje</p>
                        <div className="flex flex-wrap gap-1">
                            {emp.specialization.map(spec => (
                                <span key={spec} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                        <Button variant="secondary" size="sm" className="flex-1" icon={Calendar}>Grafik</Button>
                        <Button variant="ghost" size="sm" icon={Edit2} title="Edytuj" onClick={() => handleOpenModal(emp)} />
                        <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)} />
                    </div>
                </Card>
            ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Edytuj Pracownika" : "Dodaj Pracownika"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imię</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacje (oddziel przecinkiem)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. Masaż klasyczny, Kobido"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  className="rounded text-blue-600 focus:ring-blue-500"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <label htmlFor="active" className="text-sm text-gray-700">Aktywny pracownik</label>
            </div>
        </div>
      </Modal>
    </div>
  );
};