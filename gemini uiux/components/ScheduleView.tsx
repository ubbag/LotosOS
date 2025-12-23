import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, isSameDay, startOfDay, addMinutes, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, User } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Reservation, Employee } from '../types';
import { fetchReservations, fetchEmployees } from '../services/api';

const START_HOUR = 10; // 10:00
const END_HOUR = 22;   // 22:00
const MINUTE_HEIGHT = 1; // 1px na minutę -> 60px na godzinę
const TOTAL_DURATION_MINUTES = (END_HOUR - START_HOUR) * 60;

export const ScheduleView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate time labels for Y-axis (every hour)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      labels.push(format(addMinutes(startOfDay(currentDate), hour * 60), 'HH:mm', { locale: pl }));
    }
    return labels;
  }, [currentDate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [resData, empData] = await Promise.all([
            fetchReservations(),
            fetchEmployees()
        ]);
        setReservations(resData);
        setEmployees(empData);
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
    const todayReservations = reservations.filter(r => 
      isSameDay(parseISO(r.date), currentDate) && 
      r.therapistName === `${employees.find(e => e.id === employeeId)?.firstName} ${employees.find(e => e.id === employeeId)?.lastName}`
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

  if (loading) {
      return <div className="p-8 text-center text-gray-500">Ładowanie harmonogramu...</div>;
  }

  // Calculate grid height for lines
  const gridHeight = TOTAL_DURATION_MINUTES * MINUTE_HEIGHT;

  return (
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

        <Button icon={Plus}>Nowa Rezerwacja</Button>
      </div>

      {/* Main Schedule Grid */}
      <Card noPadding className="flex-1 overflow-hidden flex flex-col border border-gray-200 shadow-lg">
        <div className="flex-1 overflow-auto relative"> 
          <div className="flex min-w-full"> 
            
            {/* Time Axis (Left, Sticky) */}
            <div className="sticky left-0 z-40 bg-white border-r border-gray-200 flex flex-col w-10 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
              {/* Corner Cell (Sticky Top & Left) */}
              <div className="h-10 shrink-0 bg-gray-50 border-b border-gray-200 sticky top-0 z-50"></div>
              
              {/* Time Labels */}
              <div className="relative bg-white" style={{ height: gridHeight + 'px' }}>
                {timeLabels.map((time, index) => (
                    <div 
                        key={time} 
                        className="absolute w-full text-[10px] font-semibold text-gray-400 text-center pr-2"
                        style={{ 
                            top: (index * 60 * MINUTE_HEIGHT) + 'px', 
                            transform: index === 0 ? 'translateY(0)' : 'translateY(-50%)' 
                        }}
                    >
                        {time}
                    </div>
                ))}
              </div>
            </div>

            {/* Employee Columns Container - Stretches to fill space */}
            <div className="flex flex-1 min-w-0">
                {employees.map(employee => (
                <div key={employee.id} className="relative border-r border-gray-200 bg-white flex-1 min-w-[200px]">
                    {/* Employee Header (Sticky Top) */}
                    <div className="h-10 shrink-0 bg-gray-50 border-b border-gray-200 sticky top-0 z-40 flex items-center justify-center p-2 text-center shadow-sm">
                        <div className="font-bold text-gray-800 text-sm truncate w-full">
                            {employee.firstName} {employee.lastName}
                        </div>
                    </div>
                    
                    {/* Grid Content */}
                    <div className="relative" style={{ height: gridHeight + 'px' }}>
                        {/* Horizontal Grid Lines */}
                        {timeLabels.map((_, index) => (
                            <div 
                                key={index} 
                                className="absolute w-full border-b border-gray-100" 
                                style={{ top: (index * 60 * MINUTE_HEIGHT) + 'px' }}
                            ></div>
                        ))}

                        {/* Reservations */}
                        {getReservationsForEmployee(employee.id).map(res => (
                            <div
                                key={res.id}
                                className="absolute left-1 right-1 bg-purple-100 border-l-4 border-purple-500 rounded p-1 shadow-sm hover:shadow-md cursor-pointer hover:bg-purple-200 transition-all overflow-hidden z-10 text-xs"
                                style={{ top: res.top + 'px', height: res.height + 'px' }}
                                title={`${format(res.resStartDateTime, 'HH:mm')} - ${res.clientName}`}
                                onClick={() => console.log('Click reservation', res.id)}
                            >
                                <div className="font-bold text-purple-900 truncate">{format(res.resStartDateTime, 'HH:mm')} {res.serviceName}</div>
                                <div className="text-[10px] text-purple-700 truncate">{res.clientName}</div>
                                <div className="text-[9px] text-purple-500 truncate mt-0.5">
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
    </div>
  );
};