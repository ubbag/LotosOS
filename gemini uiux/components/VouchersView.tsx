import React, { useState } from 'react';
import { Ticket, Search, Plus, Calendar, User, Copy, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Voucher } from '../types';
import { ViewToggle } from './ui/ViewToggle';

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: '1',
    code: 'LOTOS-2024-XA92',
    originalValue: 500,
    currentValue: 350,
    expiryDate: '2024-12-31',
    status: 'ACTIVE',
    purchaser: 'Marek Zając',
    type: 'AMOUNT'
  },
  {
    id: '2',
    code: 'GIFT-SUMMER-88',
    originalValue: 200,
    currentValue: 200,
    expiryDate: '2024-08-30',
    status: 'ACTIVE',
    purchaser: 'Anna Nowak',
    type: 'AMOUNT'
  },
  {
    id: '3',
    code: 'VIP-GOLD-1122',
    originalValue: 1000,
    currentValue: 0,
    expiryDate: '2024-01-15',
    status: 'USED',
    purchaser: 'Firma XYZ',
    type: 'AMOUNT'
  },
  {
    id: '4',
    code: 'OLD-2023-BB',
    originalValue: 150,
    currentValue: 150,
    expiryDate: '2023-12-01',
    status: 'EXPIRED',
    purchaser: 'Krzysztof Krawczyk',
    type: 'AMOUNT'
  }
];

export const VouchersView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const getStatusVariant = (status: Voucher['status']) => {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'USED': return 'success';
      case 'EXPIRED': return 'danger';
      default: return 'neutral';
    }
  };

  const getProgressColor = (percent: number) => {
      if (percent === 0) return 'bg-gray-400';
      if (percent < 30) return 'bg-red-500';
      return 'bg-blue-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vouchery</h1>
          <p className="text-gray-500 mt-1">Zarządzanie kartami podarunkowymi</p>
        </div>
        <div className="flex gap-3 items-center">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Szukaj kodu..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full md:w-64"
            />
          </div>
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Wystaw</Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_VOUCHERS.map(voucher => {
                const percentLeft = (voucher.currentValue / voucher.originalValue) * 100;
                return (
                    <Card key={voucher.id} className="relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <Ticket size={24} />
                            </div>
                            <Badge variant={getStatusVariant(voucher.status)}>
                                {voucher.status === 'ACTIVE' ? 'AKTYWNY' : voucher.status === 'USED' ? 'WYKORZYSTANY' : 'WYGASŁ'}
                            </Badge>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-1 cursor-pointer hover:opacity-70 group" title="Kopiuj kod">
                                <h3 className="font-mono text-xl font-bold text-gray-900 tracking-wider">
                                    {voucher.code}
                                </h3>
                                <Copy size={14} className="text-gray-400 group-hover:text-blue-500"/>
                            </div>
                            <p className="text-sm text-gray-500">Nabywca: {voucher.purchaser}</p>
                        </div>

                        <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span className="text-gray-600">Stan środków:</span>
                                <span className={voucher.status === 'ACTIVE' ? 'text-blue-600 font-bold' : 'text-gray-400'}>
                                    {voucher.currentValue} PLN / {voucher.originalValue} PLN
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(percentLeft)}`} 
                                    style={{ width: `${percentLeft}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                            <div className="flex items-center text-red-500 bg-red-50 px-3 py-1 rounded-full">
                                <Calendar size={14} className="mr-2" />
                                <span>Ważny do: {voucher.expiryDate}</span>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
      ) : (
        <Card noPadding className="overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4 border-b border-blue-100">Kod</th>
                        <th className="px-6 py-4 border-b border-blue-100">Nabywca</th>
                        <th className="px-6 py-4 border-b border-blue-100">Wartość (Obecna / Pocz.)</th>
                        <th className="px-6 py-4 border-b border-blue-100">Ważność</th>
                        <th className="px-6 py-4 border-b border-blue-100">Status</th>
                        <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {MOCK_VOUCHERS.map(voucher => (
                        <tr key={voucher.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-gray-800">{voucher.code}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{voucher.purchaser}</td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">{voucher.currentValue} PLN</div>
                                <div className="text-xs text-gray-500">z {voucher.originalValue} PLN</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{voucher.expiryDate}</td>
                            <td className="px-6 py-4">
                                <Badge variant={getStatusVariant(voucher.status)}>
                                    {voucher.status === 'ACTIVE' ? 'AKTYWNY' : voucher.status === 'USED' ? 'WYKORZYSTANY' : 'WYGASŁ'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" icon={Copy} title="Kopiuj" />
                                    <Button variant="danger-ghost" size="sm" icon={Trash2} title="Usuń" />
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
        title="Wystaw Nowy Voucher"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Anuluj</Button>
            <Button onClick={() => setIsModalOpen(false)}>Generuj Voucher</Button>
          </>
        }
      >
         <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                <Ticket className="text-blue-600" />
                <div>
                    <p className="text-sm font-bold text-blue-900">Automatyczny kod</p>
                    <p className="text-xs text-blue-700">Kod zostanie wygenerowany po zapisaniu.</p>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wartość (PLN)</label>
                <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nabywca</label>
                <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                     <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Wyszukaj klienta..." />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data ważności</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
         </div>
      </Modal>
    </div>
  );
};