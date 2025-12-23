import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Calendar,
  TrendingUp,
  DollarSign,
  Plus,
  User,
  Clock,
  UserCircle,
  Edit2,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { StatCardProps, Reservation, Employee } from '../types';
import { fetchReservations, fetchEmployees, fetchClients, fetchServices, fetchRooms, createReservation, updateReservation, cancelReservation, updateReservationStatus, updateReservationPayment } from '../services/api';
import { ViewToggle } from './ui/ViewToggle';

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon: Icon }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start justify-between shadow-sm hover:shadow-md transition-all">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-xs text-blue-600 font-medium">{subtext}</p>
    </div>
    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
      <Icon size={20} />
    </div>
  </div>
);

export const ReservationsView: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    klientId: '',
    masazystaId: '',
    gabinetId: '',
    uslugaId: '',
    wariantId: '',
    data: '',
    godzina: '',
    duration: 60, // Default 60 minutes
    cenaCalokowita: 0,
    platnoscMetoda: 'GOTOWKA',
    notatki: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reservationsData, employeesData, clientsData, servicesData, roomsData] = await Promise.all([
          fetchReservations(),
          fetchEmployees(),
          fetchClients(),
          fetchServices(),
          fetchRooms()
        ]);
        setReservations(reservationsData);
        setEmployees(employeesData);
        setClients(clientsData);
        // fetchServices returns grouped object, flatten to array
        const servicesArray = Object.values(servicesData).flat();
        setServices(servicesArray);
        setRooms(roomsData);
      } catch (err) {
        setError('Nie udało się pobrać danych.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Refresh employees list when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const refreshEmployees = async () => {
        try {
          const employeesData = await fetchEmployees();
          setEmployees(employeesData);
        } catch (err) {
          console.error('Failed to refresh employees:', err);
        }
      };
      refreshEmployees();
    }
  }, [isModalOpen]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.klientId || !formData.masazystaId || !formData.gabinetId || !formData.uslugaId || !formData.data || !formData.godzina) {
      alert('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    setSubmitting(true);
    try {
      // Create datetime strings
      const startDateTime = new Date(`${formData.data}T${formData.godzina}:00`).toISOString();
      const endTime = new Date(new Date(`${formData.data}T${formData.godzina}:00`).getTime() + formData.duration * 60000);
      const endDateTime = endTime.toISOString();
      const dataISO = new Date(formData.data).toISOString();

      // Find selected service variant (use first variant for now, or add variant selection)
      const selectedService = services.find((s: any) => s.id === formData.uslugaId);
      const wariantId = selectedService?.wariantyUslugi?.[0]?.id || formData.uslugaId;

      await createReservation({
        klientId: formData.klientId,
        masazystaId: formData.masazystaId,
        gabinetId: formData.gabinetId,
        uslugaId: formData.uslugaId,
        wariantId: wariantId,
        data: dataISO,
        godzinaOd: startDateTime,
        godzinaDo: endDateTime,
        cenaCalokowita: formData.cenaCalokowita,
        zrodlo: 'ONLINE',
        platnoscMetoda: formData.platnoscMetoda as any,
        notatki: formData.notatki || undefined,
      });

      // Reload reservations
      const reservationsData = await fetchReservations();
      setReservations(reservationsData);

      // Reset form and close modal
      setFormData({
        klientId: '',
        masazystaId: '',
        gabinetId: '',
        uslugaId: '',
        wariantId: '',
        data: '',
        godzina: '',
        duration: 60,
        cenaCalokowita: 0,
        platnoscMetoda: 'GOTOWKA',
        notatki: '',
      });
      setIsModalOpen(false);
      alert('Rezerwacja została utworzona pomyślnie!');
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      alert(`Nie udało się utworzyć rezerwacji: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateReservationStatus(id, newStatus);
      const reservationsData = await fetchReservations();
      setReservations(reservationsData);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Nie udało się zmienić statusu');
    }
  };

  // Handle payment status change
  const handlePaymentChange = async (id: string, paymentStatus: string) => {
    try {
      await updateReservationPayment(id, paymentStatus);
      const reservationsData = await fetchReservations();
      setReservations(reservationsData);
    } catch (err: any) {
      console.error('Error updating payment:', err);
      alert(err.response?.data?.message || 'Nie udało się zmienić statusu płatności');
    }
  };

  // Handle delete reservation
  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) {
      return;
    }
    try {
      await cancelReservation(id);
      const reservationsData = await fetchReservations();
      setReservations(reservationsData);
      alert('Rezerwacja została anulowana');
    } catch (err: any) {
      console.error('Error deleting reservation:', err);
      alert(err.response?.data?.message || 'Nie udało się anulować rezerwacji');
    }
  };

  // Filter Logic
  const filteredReservations = activeStatus === 'all'
    ? reservations
    : reservations.filter(r => r.status === activeStatus);

  // Helpers
  const getBadgeVariant = (status: Reservation['status']) => {
    switch (status) {
      case 'NOWA': return 'warning';
      case 'POTWIERDZONA': return 'active';
      case 'ZAKONCZONA': return 'success';
      case 'ANULOWANA': return 'danger';
      default: return 'neutral';
    }
  };

  if (loading) return <div className="p-8 text-center">Ładowanie rezerwacji...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rezerwacje</h1>
          <p className="text-gray-500 mt-1">Zarządzaj wizytami i harmonogramem</p>
        </div>
        <div className="flex gap-2 items-center">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            <Button variant="secondary" icon={Filter}>Filtry</Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Nowa Rezerwacja</Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Wszystkie Rezerwacje" value="1,248" subtext="Ogółem w systemie" icon={ClipboardList} />
        <StatCard label="Dzisiejsze Wizyty" value="24" subtext="4 do potwierdzenia" icon={Calendar} />
        <StatCard label="W tym miesiącu" value="342" subtext="+12% vs pop. msc" icon={TrendingUp} />
        <StatCard label="Przychód (Estymacja)" value="42,500 zł" subtext="Z potwierdzonych wizyt" icon={DollarSign} />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['all', 'NOWA', 'POTWIERDZONA', 'ZAKONCZONA', 'ANULOWANA'].map(status => (
            <button 
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                ${activeStatus === status 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {status === 'all' ? 'Wszystkie' : status}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-auto">
                 <span className="text-gray-500 text-sm whitespace-nowrap">Data:</span>
                 <input type="date" className="bg-transparent text-sm outline-none text-gray-700 w-full" />
            </div>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Szukaj..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
            </div>
        </div>
      </div>

      {/* Reservations Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReservations.map(res => (
                <Card key={res.id}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={getBadgeVariant(res.status)}>{res.status}</Badge>
                                <span className="text-xs text-gray-400 font-mono tracking-wide">{res.reservationNumber}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{res.serviceName}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">{res.price} zł</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-3 mb-4 flex-1">
                        {/* Client Info */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <User size={16} className="text-blue-600" />
                                <p className="text-xs text-gray-600 uppercase font-bold">Klient</p>
                            </div>
                            <p className="font-semibold text-blue-900">{res.clientName}</p>
                            <p className="text-xs text-blue-600">{res.clientPhone}</p>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={14} className="text-gray-500" />
                                    <p className="text-xs text-gray-500 uppercase font-bold">Data</p>
                                </div>
                                <p className="font-semibold text-gray-900 text-sm">{res.date}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={14} className="text-gray-500" />
                                    <p className="text-xs text-gray-500 uppercase font-bold">Godzina</p>
                                </div>
                                <p className="font-semibold text-gray-900 text-sm">{res.time} ({res.duration} min)</p>
                            </div>
                        </div>

                        {/* Therapist */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <UserCircle size={16} className="text-gray-500" />
                                <p className="text-xs text-gray-500 uppercase font-bold">Terapeuta</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-gray-900 text-sm">{res.therapistName}</p>
                                <span className="text-xs text-gray-400">{res.roomName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-gray-200 mt-auto space-y-2">
                        {/* Status Actions */}
                        <div className="flex gap-2">
                            {res.status === 'NOWA' && (
                                <Button variant="primary" size="sm" className="flex-1" onClick={() => handleStatusChange(res.id, 'POTWIERDZONA')}>
                                    Potwierdź
                                </Button>
                            )}
                            {res.status === 'POTWIERDZONA' && (
                                <Button variant="success" size="sm" className="flex-1" onClick={() => handleStatusChange(res.id, 'ZAKONCZONA')}>
                                    Zakończ wizytę
                                </Button>
                            )}
                            <Button variant="danger-ghost" size="sm" icon={Trash2} title="Anuluj" onClick={() => handleDelete(res.id)} />
                        </div>
                        {/* Payment button for completed visits */}
                        {res.status === 'ZAKONCZONA' && (
                            <Button variant="success" size="sm" className="w-full" onClick={() => handlePaymentChange(res.id, 'OPLACONA')}>
                                Oznacz jako opłacona
                            </Button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
      ) : (
        <Card noPadding className="overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4 border-b border-blue-100">Numer</th>
                        <th className="px-6 py-4 border-b border-blue-100">Data</th>
                        <th className="px-6 py-4 border-b border-blue-100">Godzina</th>
                        <th className="px-6 py-4 border-b border-blue-100">Klient</th>
                        <th className="px-6 py-4 border-b border-blue-100">Usługa</th>
                        <th className="px-6 py-4 border-b border-blue-100">Terapeuta</th>
                        <th className="px-6 py-4 border-b border-blue-100">Status</th>
                        <th className="px-6 py-4 border-b border-blue-100 text-right">Cena</th>
                        <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredReservations.map((res) => (
                        <tr key={res.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">{res.reservationNumber}</td>
                            <td className="px-6 py-4 text-sm font-semibold">{res.date}</td>
                            <td className="px-6 py-4 text-sm">{res.time} ({res.duration}m)</td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">{res.clientName}</div>
                                <div className="text-xs text-gray-500">{res.clientPhone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{res.serviceName}</td>
                            <td className="px-6 py-4 text-sm">
                                <div className="text-gray-900">{res.therapistName}</div>
                                <div className="text-xs text-gray-400">{res.roomName}</div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={getBadgeVariant(res.status)}>{res.status}</Badge>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600">{res.price} zł</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    {res.status === 'NOWA' && (
                                        <Button variant="primary" size="sm" onClick={() => handleStatusChange(res.id, 'POTWIERDZONA')}>
                                            Potwierdź
                                        </Button>
                                    )}
                                    {res.status === 'POTWIERDZONA' && (
                                        <Button variant="success" size="sm" onClick={() => handleStatusChange(res.id, 'ZAKONCZONA')}>
                                            Zakończ
                                        </Button>
                                    )}
                                    {res.status === 'ZAKONCZONA' && (
                                        <Button variant="success" size="sm" onClick={() => handlePaymentChange(res.id, 'OPLACONA')}>
                                            Opłacona
                                        </Button>
                                    )}
                                    <Button variant="danger-ghost" size="sm" icon={Trash2} title="Anuluj" onClick={() => handleDelete(res.id)} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
      )}

      {/* New Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nowa Rezerwacja"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Anuluj
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Tworzenie...' : 'Utwórz Rezerwację'}
                </Button>
            </>
        }
      >
         <div className="space-y-6">
             {/* 1. Client */}
             <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">Klient *</label>
                 <select
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   value={formData.klientId}
                   onChange={(e) => setFormData({ ...formData, klientId: e.target.value })}
                 >
                   <option value="">Wybierz klienta...</option>
                   {clients.map((client: any) => (
                     <option key={client.id} value={client.id}>
                       {client.imie} {client.nazwisko} - {client.phone}
                     </option>
                   ))}
                 </select>
             </div>

             {/* 2. Service */}
             <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">Usługa *</label>
                 <select
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   value={formData.uslugaId}
                   onChange={(e) => {
                     const service = services.find((s: any) => s.id === e.target.value);
                     setFormData({
                       ...formData,
                       uslugaId: e.target.value,
                       cenaCalokowita: service?.wariantyUslugi?.[0]?.cenaRegularna || 0,
                       duration: service?.wariantyUslugi?.[0]?.czasMinut || 60
                     });
                   }}
                 >
                     <option value="">Wybierz usługę...</option>
                     {services.map((service: any) => (
                       <option key={service.id} value={service.id}>
                         {service.nazwa} - {service.wariantyUslugi?.[0]?.cenaRegularna || 0} zł
                       </option>
                     ))}
                 </select>
             </div>

             {/* 3. Date & Time */}
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Godzina *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="HH:MM"
                      value={formData.godzina}
                      onChange={(e) => setFormData({ ...formData, godzina: e.target.value })}
                    />
                 </div>
             </div>

             {/* 4. Resource Allocation */}
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terapeuta *</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.masazystaId}
                      onChange={(e) => setFormData({ ...formData, masazystaId: e.target.value })}
                    >
                        <option value="">Wybierz terapeutę...</option>
                        {employees.filter(emp => emp.status === 'ACTIVE').map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gabinet *</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.gabinetId}
                      onChange={(e) => setFormData({ ...formData, gabinetId: e.target.value })}
                    >
                        <option value="">Wybierz gabinet...</option>
                        {rooms.map((room: any) => (
                          <option key={room.id} value={room.id}>
                            {room.nazwa || `Gabinet ${room.numer}`}
                          </option>
                        ))}
                    </select>
                 </div>
             </div>

             {/* 5. Payment */}
             <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                 <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                     <span className="text-sm text-gray-600">Cena</span>
                     <span className="font-bold text-gray-900">{formData.cenaCalokowita} zł</span>
                 </div>
                 <div className="space-y-2">
                     <label className="block text-sm font-medium text-gray-700">Metoda płatności</label>
                     <select
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                       value={formData.platnoscMetoda}
                       onChange={(e) => setFormData({ ...formData, platnoscMetoda: e.target.value })}
                     >
                         <option value="GOTOWKA">Gotówka</option>
                         <option value="KARTA">Karta</option>
                         <option value="PRZELEW">Przelew</option>
                         <option value="PAKIET">Pakiet godzinowy</option>
                         <option value="VOUCHER">Voucher</option>
                     </select>
                 </div>
                 <div className="mt-3">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Notatki (opcjonalnie)</label>
                     <textarea
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                       rows={2}
                       placeholder="Dodatkowe informacje..."
                       value={formData.notatki}
                       onChange={(e) => setFormData({ ...formData, notatki: e.target.value })}
                     />
                 </div>
             </div>
         </div>
      </Modal>
    </div>
  );
};