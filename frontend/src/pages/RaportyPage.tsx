import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { FileText, DollarSign, TrendingUp, Calendar, Download, Users, Package, Activity } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RaportUtarg {
  dzien: string;
  utarg: number;
  liczbaRezerwacji: number;
}

interface Stats {
  utargDzienny?: number;
  utargMiesieczny?: number;
  liczbaRezerwacji?: number;
  liczbaKlientow?: number;
}

export const RaportyPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [dataOd, setDataOd] = useState('');
  const [dataDo, setDataDo] = useState('');
  const [raportUtarg, setRaportUtarg] = useState<RaportUtarg[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default dates (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    setDataDo(today.toISOString().split('T')[0]);
    setDataOd(weekAgo.toISOString().split('T')[0]);

    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get stats from different endpoints
      const today = new Date().toISOString().split('T')[0];
      const [dziennyRes, rezerwacjeRes] = await Promise.all([
        apiClient.get('/raporty/utarg/dzienny', { params: { data: today } }).catch(() => ({ data: { data: { utarg: 0 } } })),
        apiClient.get('/rezerwacje', { params: { limit: 1 } }).catch(() => ({ data: { pagination: { total: 0 } } })),
      ]);

      setStats({
        utargDzienny: dziennyRes.data?.data?.utarg || 0,
        utargMiesieczny: 0, // Would need month endpoint
        liczbaRezerwacji: rezerwacjeRes.data?.pagination?.total || 0,
        liczbaKlientow: 0, // Would need endpoint
      });
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadRaportUtarg = async () => {
    if (!dataOd || !dataDo) {
      setError('Wybierz zakres dat');
      return;
    }

    setLoading(true);
    try {
      // Use the correct endpoint - this might need adjustment based on actual backend
      const rok = new Date(dataOd).getFullYear();
      const miesiac = new Date(dataOd).getMonth() + 1;
      const response = await apiClient.get('/raporty/utarg/miesieczy', {
        params: { rok, miesiac },
      });
      const data = response.data?.data || [];
      setRaportUtarg(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (raportUtarg.length === 0) return;

    const headers = 'Dzień,Utarg (zł),Liczba rezerwacji\n';
    const rows = raportUtarg
      .map((r) => `${formatDate(r.dzien)},${r.utarg.toFixed(2)},${r.liczbaRezerwacji}`)
      .join('\n');

    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raport_utarg_${dataOd}_${dataDo}.csv`;
    link.click();
  };

  const exportToPdf = () => {
    if (raportUtarg.length === 0) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Raport Utargu - Lotos SPA', 105, 20, { align: 'center' });

    // Date range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Okres: ${formatDate(dataOd)} - ${formatDate(dataDo)}`, 105, 30, { align: 'center' });

    // Summary statistics
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const suma = calculateTotal();
    const srednia = calculateAverage();
    const liczbaDni = raportUtarg.length;

    doc.text(`Suma: ${formatCurrency(suma)}`, 20, 45);
    doc.text(`Średnia dzienna: ${formatCurrency(srednia)}`, 20, 52);
    doc.text(`Liczba dni: ${liczbaDni}`, 20, 59);

    // Table
    const tableData = raportUtarg.map((r) => [
      formatDate(r.dzien),
      r.liczbaRezerwacji.toString(),
      `${r.utarg.toFixed(2)} zł`,
    ]);

    // Add total row
    const totalReservations = raportUtarg.reduce((sum, r) => sum + r.liczbaRezerwacji, 0);
    tableData.push(['SUMA', totalReservations.toString(), `${suma.toFixed(2)} zł`]);

    autoTable(doc, {
      startY: 70,
      head: [['Dzień', 'Liczba rezerwacji', 'Utarg']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        textColor: 50,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' },
      },
      footStyles: {
        fillColor: [219, 234, 254],
        textColor: 30,
        fontStyle: 'bold',
      },
      didParseCell: (data) => {
        // Style the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [219, 234, 254];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [30, 58, 138];
        }
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Strona ${i} z ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Wygenerowano: ${new Date().toLocaleString('pl-PL')}`,
        20,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Save
    doc.save(`raport_utarg_${dataOd}_${dataDo}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} zł`;
  };

  const calculateTotal = () => {
    return raportUtarg.reduce((sum, r) => sum + r.utarg, 0);
  };

  const calculateAverage = () => {
    if (raportUtarg.length === 0) return 0;
    return calculateTotal() / raportUtarg.length;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Raporty</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Utarg dzienny</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : formatCurrency(stats.utargDzienny || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">dzisiaj</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Utarg miesięczny</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : formatCurrency(stats.utargMiesieczny || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">aktualny miesiąc</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Liczba rezerwacji</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.liczbaRezerwacji || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">w sumie</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Liczba klientów</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.liczbaKlientow || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">w bazie</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Report */}
        <Card title="Raport utargu" className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Data od"
                type="date"
                value={dataOd}
                onChange={(e) => setDataOd(e.target.value)}
              />
              <Input
                label="Data do"
                type="date"
                value={dataDo}
                onChange={(e) => setDataDo(e.target.value)}
              />
              <div className="flex items-end">
                <Button onClick={loadRaportUtarg} className="w-full flex items-center gap-2">
                  <FileText size={18} />
                  Generuj raport
                </Button>
              </div>
            </div>

            {raportUtarg.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-6">
                    <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                      <span className="text-sm text-gray-600 block">Suma</span>
                      <span className="font-bold text-2xl text-blue-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                      <span className="text-sm text-gray-600 block">Średnia dzienna</span>
                      <span className="font-bold text-2xl text-blue-600">{formatCurrency(calculateAverage())}</span>
                    </div>
                    <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                      <span className="text-sm text-gray-600 block">Dni</span>
                      <span className="font-bold text-2xl text-blue-600">{raportUtarg.length}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={exportToCsv} variant="secondary" className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                      <Download size={18} />
                      Eksportuj CSV
                    </Button>
                    <Button onClick={exportToPdf} variant="secondary" className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700">
                      <FileText size={18} />
                      Eksportuj PDF
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Dzień</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-blue-900">
                          Liczba rezerwacji
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-blue-900">
                          Utarg (zł)
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-blue-900">
                          Wykres
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {raportUtarg.map((row, idx) => {
                        const maxUtarg = Math.max(...raportUtarg.map(r => r.utarg));
                        const barWidth = maxUtarg > 0 ? (row.utarg / maxUtarg) * 100 : 0;
                        return (
                          <tr key={idx} className={`border-b transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 flex items-center gap-2">
                              <Calendar size={16} className="text-blue-600" />
                              <span className="font-medium text-gray-900">{formatDate(row.dzien)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-flex items-center gap-2">
                                <Activity size={14} className="text-blue-600" />
                                <span className="font-semibold text-gray-900">{row.liczbaRezerwacji}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600">
                              {formatCurrency(row.utarg)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${barWidth}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-blue-100 font-bold border-t-2 border-blue-300">
                      <tr>
                        <td className="px-6 py-4 text-blue-900 text-lg">SUMA</td>
                        <td className="px-6 py-4 text-right text-blue-900 text-lg">
                          {raportUtarg.reduce((sum, r) => sum + r.liczbaRezerwacji, 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-900 text-xl">{formatCurrency(calculateTotal())}</td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};
