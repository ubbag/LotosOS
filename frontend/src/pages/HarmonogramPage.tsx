import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, isSameDay, startOfDay, addMinutes, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Layout } from '@components/Layout';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Modal } from '@components/ui/Modal';
import { Reservation, Employee, Client, Usluga } from '@types';
import { fetchReservations, fetchEmployees, fetchClients, apiClient } from '@services/api';

const START_HOUR = 10; // 10:00
const END_HOUR = 22;   // 22:00
const MINUTE_HEIGHT = 2; // 2px na minutę -> 120px na godzinę (zwiększone dla lepszej widoczności)
const SLOT_DURATION = 30; // Podziałka co 30 minut
const TOTAL_DURATION_MINUTES = (END_HOUR - START_HOUR) * 60;

interface ReservationFormData {
  employeeId: string;
  employeeName: string;
  date: Date;
  startTime: string; // Format HH:mm
  endTime: string;   // Format HH:mm
  clientId: string;
  serviceId: string;
  variantId: string;
}

export const HarmonogramPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Usluga[]>([]);
  const [loading, setLoading] = useState(true);

  // Reservation form state
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    employeeId: '',
    employeeName: '',
    date: new Date(),
    startTime: '',
    endTime: '',
    clientId: '',
    serviceId: '',
    variantId: '',
  });

  // Generate time labels for Y-axis (every 30 minutes)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let minutes = 0; minutes < TOTAL_DURATION_MINUTES; minutes += SLOT_DURATION) {
      const hour = START_HOUR + Math.floor(minutes / 60);
      const minute = minutes % 60;
      labels.push(format(addMinutes(startOfDay(currentDate), hour * 60 + minute), 'HH:mm', { locale: pl }));
    }
    return labels;
  }, [currentDate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [resData, empData, clientsData, servicesData] = await Promise.all([
          fetchReservations(),
          fetchEmployees(),
          fetchClients(),
          apiClient.get('/uslugi').then(res => {
            // Flatten grouped services
            const grouped = res.data?.data || {};
            const allServices: Usluga[] = [];
            Object.values(grouped).forEach((serviceArray: any) => {
              if (Array.isArray(serviceArray)) {
                allServices.push(...serviceArray);
              }
            });
            return allServices;
          })
        ]);
        setReservations(resData);
        setEmployees(empData);
        setClients(clientsData);
        setServices(servicesData);
      } catch (error) {
        console.error("Failed to load schedule data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentDate]);

  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getReservationsForEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return [];

    const todayReservations = reservations.filter(r =>
      isSameDay(parseISO(r.date), currentDate) &&
      r.therapistName === `${employee.firstName} ${employee.lastName}`
    );

    return todayReservations.map(res => {
      const resStartDateTime = new Date(`${res.date}T${res.time}:00`);

      // Calculate position (top) and height for the reservation block
      const totalMinutesFromDayStart = resStartDateTime.getHours() * 60 + resStartDateTime.getMinutes();
      const startMinutesOffset = (START_HOUR * 60);

      const top = (totalMinutesFromDayStart - startMinutesOffset) * MINUTE_HEIGHT;
      const height = res.duration * MINUTE_HEIGHT;

      return { ...res, top, height, resStartDateTime };
    }).filter(res => res.top >= 0 && res.top < TOTAL_DURATION_MINUTES * MINUTE_HEIGHT);
  };

  // Handle clicking on a time slot
  const handleSlotClick = (employeeId: string, slotIndex: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const minutesFromStart = slotIndex * SLOT_DURATION;
    const hour = START_HOUR + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    setFormData({
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: currentDate,
      startTime,
      endTime: startTime, // Will be updated when variant is selected
      clientId: '',
      serviceId: '',
      variantId: '',
    });
    setShowReservationModal(true);
  };

  // Handle service/variant selection and auto-calculate end time
  const handleVariantChange = (variantId: string) => {
    setFormData(prev => ({ ...prev, variantId }));

    // Find the variant and calculate end time
    const service = services.find(s => s.id === formData.serviceId);
    if (service) {
      const variant = service.wariantyUslugi.find(v => v.id === variantId);
      if (variant) {
        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = startTotalMinutes + variant.czasMinut;
        const endHour = Math.floor(endTotalMinutes / 60);
        const endMinute = endTotalMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        setFormData(prev => ({ ...prev, endTime }));
      }
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceId, variantId: '', endTime: prev.startTime }));
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const payload = {
        klientId: formData.clientId,
        usługaId: formData.serviceId,
        wariantId: formData.variantId,
        masazystaId: formData.employeeId,
        gabinetId: '1', // TODO: Add room selection
        data: dateStr,
        godzinaOd: `${dateStr}T${formData.startTime}:00.000Z`,
        godzinaDo: `${dateStr}T${formData.endTime}:00.000Z`,
        notatki: '',
      };

      await apiClient.post('/rezerwacje', payload);

      // Reload reservations
      const resData = await fetchReservations();
      setReservations(resData);

      setShowReservationModal(false);
      setFormData({
        employeeId: '',
        employeeName: '',
        date: new Date(),
        startTime: '',
        endTime: '',
        clientId: '',
        serviceId: '',
        variantId: '',
      });
    } catch (error) {
      console.error('Failed to create reservation:', error);
      alert('Nie udało się utworzyć rezerwacji. Sprawdź konsolę.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Ładowanie harmonogramu...</div>
      </Layout>
    );
  }

  // Calculate grid height for lines
  const gridHeight = TOTAL_DURATION_MINUTES * MINUTE_HEIGHT;
  const numberOfSlots = Math.floor(TOTAL_DURATION_MINUTES / SLOT_DURATION);

  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                Harmonogram Dnia
              </h1>
              <p className="text-sm text-gray-500 capitalize">
                {format(currentDate, 'EEEE, d MMMM yyyy', { locale: pl })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button onClick={prevDay} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="px-4 py-1 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all">
              Dzisiaj
            </button>
            <button onClick={nextDay} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
              <ChevronRight size={20} />
            </button>
          </div>

          <Button onClick={() => setShowReservationModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nowa Rezerwacja
          </Button>
        </div>

        {/* Main Schedule Grid */}
        <Card className="flex-1 overflow-hidden flex flex-col border border-gray-200 shadow-lg p-0">
          <div className="flex-1 overflow-auto relative">
            <div className="flex min-w-full">

              {/* Time Axis (Left, Sticky) */}
              <div className="sticky left-0 z-40 bg-white border-r-2 border-gray-300 flex flex-col w-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.04)]">
                {/* Corner Cell (Sticky Top & Left) */}
                <div className="h-12 shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-300 sticky top-0 z-50 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">Czas</span>
                </div>

                {/* Time Labels */}
                <div className="relative bg-white pt-3 px-1" style={{ height: gridHeight + 'px' }}>
                  {timeLabels.map((time, index) => {
                    // Add extra offset for first label to prevent it from being cut off by sticky header
                    const topOffset = index === 0 ? 12 : (index * SLOT_DURATION * MINUTE_HEIGHT);
                    return (
                      <div
                        key={time}
                        className="absolute w-full text-xs font-bold text-gray-700 text-center py-1"
                        style={{
                          top: topOffset + 'px',
                          transform: 'translateY(-50%)',
                          lineHeight: '1.2'
                        }}
                      >
                        {time}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Employee Columns Container - Stretches to fill space */}
              <div className="flex flex-1 min-w-0">
                {employees.map(employee => (
                  <div key={employee.id} className="relative border-r-2 border-gray-300 bg-white flex-1 min-w-[250px]">
                    {/* Employee Header (Sticky Top) */}
                    <div className="h-12 shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-300 sticky top-0 z-40 flex items-center justify-center p-3 text-center shadow-md">
                      <div className="font-bold text-gray-900 text-base truncate w-full">
                        {employee.firstName} {employee.lastName}
                      </div>
                    </div>

                    {/* Grid Content */}
                    <div className="relative" style={{ height: gridHeight + 'px' }}>
                      {/* Clickable Time Slots (every 30 minutes) */}
                      {Array.from({ length: numberOfSlots }).map((_, slotIndex) => {
                        const isHourLine = slotIndex % 2 === 0;
                        return (
                          <div
                            key={slotIndex}
                            className={`absolute w-full border-b cursor-pointer hover:bg-purple-50/70 transition-all hover:shadow-inner ${
                              isHourLine ? 'border-gray-400' : 'border-gray-200'
                            }`}
                            style={{
                              top: (slotIndex * SLOT_DURATION * MINUTE_HEIGHT) + 'px',
                              height: (SLOT_DURATION * MINUTE_HEIGHT) + 'px',
                              padding: '1.5rem',
                              boxSizing: 'border-box'
                            }}
                            onClick={() => handleSlotClick(employee.id, slotIndex)}
                            title={`Kliknij aby dodać rezerwację o ${timeLabels[slotIndex]}`}
                          />
                        );
                      })}

                      {/* Reservations (overlay on top of slots) */}
                      {getReservationsForEmployee(employee.id).map(res => (
                        <div
                          key={res.id}
                          className="absolute bg-purple-100 border-l-4 border-purple-500 rounded-lg shadow-sm hover:shadow-md cursor-pointer hover:bg-purple-200 transition-all overflow-hidden z-20 text-xs"
                          style={{
                            top: (res.top + 12) + 'px',
                            height: (res.height - 24) + 'px',
                            left: '20px',
                            right: '20px',
                            padding: '1.5rem'
                          }}
                          title={`${format(res.resStartDateTime!, 'HH:mm')} - ${res.clientName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Click reservation', res.id);
                          }}
                        >
                          <div className="font-bold text-purple-900 truncate text-sm">
                            {format(res.resStartDateTime!, 'HH:mm')} - {format(addMinutes(res.resStartDateTime!, res.duration), 'HH:mm')} {res.serviceName}
                          </div>
                          <div className="text-xs text-purple-700 truncate mt-2">{res.clientName}</div>
                          <div className="text-[10px] text-purple-500 truncate mt-2">
                            {res.roomName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Reservation Modal */}
        <Modal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          title="Nowa Rezerwacja"
          size="lg"
        >
          <form onSubmit={handleSubmitReservation} className="space-y-4">
            {/* Pre-filled info */}
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Terapeuta:</span>
                <span className="text-sm font-bold text-gray-900">{formData.employeeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Data:</span>
                <span className="text-sm font-bold text-gray-900">{format(formData.date, 'dd MMMM yyyy', { locale: pl })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Godzina rozpoczęcia:</span>
                <span className="text-sm font-bold text-gray-900">{formData.startTime}</span>
              </div>
              {formData.endTime !== formData.startTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Godzina zakończenia:</span>
                  <span className="text-sm font-bold text-purple-600">{formData.endTime}</span>
                </div>
              )}
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klient *</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                required
              >
                <option value="">Wybierz klienta...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usługa *</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={formData.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                required
              >
                <option value="">Wybierz usługę...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.nazwa}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Selection */}
            {selectedService && selectedService.wariantyUslugi.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wariant czasowy *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedService.wariantyUslugi.map(variant => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantChange(variant.id)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.variantId === variant.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{variant.czasMinut} minut</div>
                      <div className="text-sm text-purple-600 font-medium">{variant.cenaRegularna} zł</div>
                      {variant.cenaPromocyjna && (
                        <div className="text-xs text-green-600">Promocja: {variant.cenaPromocyjna} zł</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setShowReservationModal(false)}>
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={!formData.clientId || !formData.serviceId || !formData.variantId}
              >
                Utwórz Rezerwację
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
