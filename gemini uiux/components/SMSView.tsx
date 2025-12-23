import React from 'react';
import { MessageSquare, Send, Users, History, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const SMSView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kampanie SMS</h1>
          <p className="text-gray-500 mt-1">Powiadomienia i marketing bezpośredni</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send SMS Form */}
        <div className="lg:col-span-2">
            <Card className="h-full">
                <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <AlertCircle className="text-blue-600" size={24}/>
                    <div>
                        <h4 className="font-bold text-blue-900">Stan konta SMS</h4>
                        <p className="text-sm text-blue-700">Pozostało 458 wiadomości w Twoim pakiecie.</p>
                    </div>
                    <Button size="sm" variant="secondary" className="ml-auto">Doładuj</Button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Odbiorcy</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">Wszyscy Klienci (854)</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200 hover:bg-gray-200">Solenizanci</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200 hover:bg-gray-200">Aktywni w tym msc</button>
                        </div>
                        <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Lub wpisz numer ręcznie..." />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Treść wiadomości</label>
                         <textarea 
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                            placeholder="Wpisz treść wiadomości..."
                            defaultValue="Lotos SPA: Przypominamy o jutrzejszej wizycie o godz. 14:00. Prosimy o potwierdzenie."
                         ></textarea>
                         <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Użyj szablonu: <a href="#" className="text-blue-600 hover:underline">Przypomnienie</a>, <a href="#" className="text-blue-600 hover:underline">Urodziny</a></span>
                            <span>98 / 160 znaków (1 SMS)</span>
                         </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button icon={Send} size="lg">Wyślij Wiadomość</Button>
                    </div>
                </div>
            </Card>
        </div>

        {/* SMS History */}
        <div className="lg:col-span-1">
             <Card className="h-full">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <History size={20} className="text-gray-500"/>
                        Ostatnie wysyłki
                    </h3>
                 </div>
                 
                 <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-gray-900">Przypomnienie o wizycie</span>
                                <span className="text-xs text-gray-400">12:30</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                Lotos SPA: Przypominamy o jutrzejszej wizycie o godz...
                            </p>
                            <div className="flex items-center justify-between">
                                <Badge variant="success">Dostarczono</Badge>
                                <span className="text-xs text-gray-400">Do: Anna Nowak</span>
                            </div>
                        </div>
                    ))}
                 </div>
                 
                 <Button variant="ghost" className="w-full mt-6 text-blue-600">Zobacz pełną historię</Button>
             </Card>
        </div>
      </div>
    </div>
  );
};