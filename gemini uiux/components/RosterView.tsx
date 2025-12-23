import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isToday, 
  addWeeks, 
  subWeeks, 
  endOfWeek
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Employee } from '../types';
import { fetchEmployees } from '../services/api';

interface Shift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'WORK' | 'LEAVE' | 'SICK';
}

export const RosterView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Date Calculations ---
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // --- Effects ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const emps = await fetchEmployees();
        setEmployees(emps);

        const generatedShifts: Shift[] = [];
        emps.forEach(emp => {
            weekDays.forEach(day => {
                if (Math.random() > 0.3) {
                    generatedShifts.push({
                        id: `shift-${emp.id}-${day.toISOString()}`,
                        employeeId: emp.id,
                        date: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        type: 'WORK'
                    });
                }
            });
        });
        setShifts(generatedShifts);

      } catch (error) {
        console.error("Failed to load roster data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]);

  // --- Handlers ---
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getShiftForCell = (employeeId: string, day: Date) => {
    return shifts.find(s => 
      s.employeeId === employeeId && 
      isSameDay(new Date(s.date), day)
    );
  };

  if (loading && employees.length === 0) {
      return <div className="p-8 text-center text-gray-500">Ładowanie grafiku...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarIcon size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                    Grafik Pracy: {format(currentDate, 'MMMM yyyy', { locale: pl })}
                </h1>
                <p className="text-sm text-gray-500">
                    {format(startDate, 'd MMM', { locale: pl })} - {format(endDate, 'd MMM', { locale: pl })}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button onClick={prevWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="px-4 py-1 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all">
                Dzisiaj
            </button>
            <button onClick={nextWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                <ChevronRight size={20} />
            </button>
        </div>

        <Button icon={Plus}>Dodaj Zmianę</Button>
      </div>

      {/* Calendar Grid */}
      <Card noPadding className="flex-1 overflow-hidden flex flex-col border border-gray-200 shadow-lg">
        <div className="overflow-auto flex-1">
            <table className="w-full border-collapse relative">
                {/* Table Header */}
                <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                    <tr>
                        <th className="p-4 text-left font-bold text-gray-500 text-sm border-b border-r border-gray-200 min-w-[200px] sticky left-0 bg-gray-50 z-30">
                            Pracownik
                        </th>
                        {weekDays.map((day) => (
                            <th 
                                key={day.toISOString()} 
                                className={`
                                    p-3 text-center min-w-[120px] border-b border-gray-200
                                    ${isToday(day) ? 'bg-blue-50/50' : ''}
                                `}
                            >
                                <div className={`text-xs uppercase font-bold mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {format(day, 'EEE', { locale: pl })}
                                </div>
                                <div className={`
                                    text-xl font-bold inline-flex items-center justify-center w-8 h-8 rounded-full
                                    ${isToday(day) ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}
                                `}>
                                    {format(day, 'd')}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-100">
                    {employees.map(employee => (
                        <tr key={employee.id} className="group hover:bg-gray-50/30 transition-colors">
                            {/* Employee Column (Sticky) */}
                            <td className="p-4 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 transition-colors z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                        {employee.firstName[0]}{employee.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{employee.firstName} {employee.lastName}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {employee.specialization.slice(0, 1).map((spec, i) => (
                                                <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Day Cells */}
                            {weekDays.map(day => {
                                const shift = getShiftForCell(employee.id, day);
                                const isDayToday = isToday(day);

                                return (
                                    <td 
                                        key={day.toISOString()} 
                                        className={`
                                            p-2 border-r border-gray-100 relative h-24 align-top transition-colors
                                            ${isDayToday ? 'bg-blue-50/10' : ''}
                                            hover:bg-gray-50 cursor-pointer
                                        `}
                                    >
                                        {shift ? (
                                            <div className="bg-white border border-l-4 border-l-blue-500 border-gray-200 rounded-md p-2 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-center">
                                                <div className="flex items-center text-xs font-bold text-gray-700 mb-1">
                                                    <Clock size={12} className="mr-1 text-blue-500" />
                                                    {shift.startTime} - {shift.endTime}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <Plus size={16} />
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
