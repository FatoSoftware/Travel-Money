import React, { useState } from 'react';
import { Trip, Participant, Expense, Category, Settlement } from '../types';
import {
  calculateTripSummary,
  calculateCategoryBreakdown,
  calculatePaymentTypeBreakdown,
  calculateLocalityBreakdown,
  formatMoney,
  getCurrencySymbol,
} from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';
import {
  PieChart,
  Users,
  CreditCard,
  Banknote,
  MapPin,
  TrendingUp,
  Coins,
  ArrowUpRight,
  Sparkles,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface StatsPageProps {
  trip: Trip;
  participants: Participant[];
  expenses: Expense[];
  categories: Category[];
  settlements: Settlement[];
}

export const StatsPage: React.FC<StatsPageProps> = ({
  trip,
  participants,
  expenses,
  categories,
  settlements,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'participants' | 'payment' | 'locality'>('categories');

  const summary = calculateTripSummary(trip, participants, expenses, settlements);
  const categoryStats = calculateCategoryBreakdown(trip, categories, expenses);
  const paymentStats = calculatePaymentTypeBreakdown(trip, expenses);
  const localityStats = calculateLocalityBreakdown(trip, expenses);

  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);

  // Calculate trip duration in days
  const start = new Date(trip.startDate).getTime();
  const end = new Date(trip.endDate).getTime();
  const diffDays = Math.max(1, Math.round(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1);
  const dailyAverage = summary.totalSpentBase / diffDays;

  // Max Category
  const topCategory = categoryStats[0];

  // Max Payer
  const sortedPayers = [...summary.participantBalances].sort((a, b) => b.totalPaid - a.totalPaid);
  const topPayer = sortedPayers[0];

  if (tripExpenses.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-10 border border-indigo-100 shadow-sm text-center space-y-3 pb-24">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl">
          📊
        </div>
        <h3 className="font-extrabold text-lg text-indigo-950">No hay datos suficientes</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Añade tus primeros gastos para visualizar las estadísticas, gráficos y clasificaciones por participante, categoría y forma de pago.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Top Quick Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Gasto */}
        <div className="p-4 rounded-[1.5rem] bg-white border border-indigo-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Gasto Total
          </span>
          <span className="text-base sm:text-xl font-black text-indigo-950 tracking-tight block">
            {formatMoney(summary.totalSpentBase, trip.baseCurrency)}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
            {summary.expensesCount} gastos registrados
          </span>
        </div>

        {/* Media diaria */}
        <div className="p-4 rounded-[1.5rem] bg-white border border-indigo-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Media Diaria
          </span>
          <span className="text-base sm:text-xl font-black text-amber-500 tracking-tight block">
            {formatMoney(dailyAverage, trip.baseCurrency)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            En {diffDays} días de viaje
          </span>
        </div>

        {/* Top Categoría */}
        <div className="p-4 rounded-[1.5rem] bg-white border border-indigo-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Mayor Categoría
          </span>
          <span className="text-sm sm:text-base font-extrabold text-indigo-600 truncate block">
            {topCategory ? topCategory.category.name : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            {topCategory ? `${topCategory.percentage}% del total` : '-'}
          </span>
        </div>

        {/* Mayor Pagador */}
        <div className="p-4 rounded-[1.5rem] bg-white border border-indigo-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Mayor Pagador
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-600 truncate block">
            {topPayer ? `${topPayer.participant.avatar || '👤'} ${topPayer.participant.name}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            {topPayer ? formatMoney(topPayer.totalPaid, trip.baseCurrency) : '-'}
          </span>
        </div>
      </div>

      {/* Multi-Currency Spent Pill (if multi-currency used) */}
      {Object.keys(summary.spentByCurrency).length > 1 && (
        <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Desglose por Monedas Originales</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.spentByCurrency).map(([curr, amt]) => (
              <div
                key={curr}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <span className="text-indigo-600">{curr}:</span>
                <span>{formatMoney(amt, curr)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs for Sub-breakdowns */}
      <div className="flex p-1 bg-white rounded-2xl border border-indigo-100 shadow-xs">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'participants'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Participantes
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payment'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tipo de Pago
        </button>
        <button
          onClick={() => setActiveTab('locality')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'locality'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Localidades
        </button>
      </div>

      {/* 1. CLASIFICACIÓN POR CATEGORÍAS */}
      {activeTab === 'categories' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Gastos por Categoría ({categoryStats.length})
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Ordenado por mayor importe</span>
          </div>

          <div className="space-y-2.5">
            {categoryStats.map((item) => (
              <div
                key={item.category.id}
                className="bg-white border border-indigo-100/80 rounded-2xl p-4 shadow-xs space-y-2.5 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: item.category.color }}
                    >
                      <CategoryIcon name={item.category.icon} size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.category.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {item.count} {item.count === 1 ? 'gasto' : 'gastos'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-sm text-slate-900 block">
                      {formatMoney(item.total, trip.baseCurrency)}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{item.percentage}%</span>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CLASIFICACIÓN POR PARTICIPANTES */}
      {activeTab === 'participants' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Gastos y Consumo por Persona
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{summary.participantsCount} personas</span>
          </div>

          <div className="space-y-3">
            {summary.participantBalances.map((pb) => {
              const paidPercent =
                summary.totalSpentBase > 0
                  ? Number(((pb.totalPaid / summary.totalSpentBase) * 100).toFixed(1))
                  : 0;

              return (
                <div
                  key={pb.participant.id}
                  className="bg-white border border-indigo-100/80 rounded-2xl p-4 shadow-xs space-y-3 hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{pb.participant.avatar || '👤'}</span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{pb.participant.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {paidPercent}% del gasto del grupo
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Ha Pagado</span>
                      <span className="font-black text-sm text-slate-900">
                        {formatMoney(pb.totalPaid, trip.baseCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar of amount paid */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>

                  {/* Sub breakdown: Paid vs Owed/Consumed */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Total consumido:</span>
                      <span className="font-bold text-slate-800">
                        {formatMoney(pb.totalOwed, trip.baseCurrency)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Saldo neto:</span>
                      <span
                        className={`font-black ${
                          pb.netBalance > 0
                            ? 'text-emerald-600'
                            : pb.netBalance < 0
                            ? 'text-rose-500'
                            : 'text-slate-700'
                        }`}
                      >
                        {pb.netBalance > 0 ? `+${formatMoney(pb.netBalance, trip.baseCurrency)}` : formatMoney(pb.netBalance, trip.baseCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CLASIFICACIÓN POR TIPO DE PAGO: EFECTIVO VS TARJETA */}
      {activeTab === 'payment' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="px-1">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Comparativa: Efectivo vs Tarjeta
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card Card */}
            <div className="bg-white border border-indigo-100 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">Pago con Tarjeta</h4>
                  <span className="text-xs text-indigo-600 font-semibold">
                    {paymentStats.card.count} transacciones ({paymentStats.card.percentage}%)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-2xl font-black text-slate-900 block">
                  {formatMoney(paymentStats.card.total, trip.baseCurrency)}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${paymentStats.card.percentage}%` }}
                />
              </div>
            </div>

            {/* Cash Card */}
            <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">Pago en Efectivo</h4>
                  <span className="text-xs text-emerald-600 font-semibold">
                    {paymentStats.cash.count} transacciones ({paymentStats.cash.percentage}%)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-2xl font-black text-slate-900 block">
                  {formatMoney(paymentStats.cash.total, trip.baseCurrency)}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${paymentStats.cash.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLASIFICACIÓN POR LOCALIDADES / CIUDADES */}
      {activeTab === 'locality' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              Gastos por Localidad o Ciudad ({localityStats.length})
            </h3>
          </div>

          <div className="space-y-2">
            {localityStats.map((loc) => (
              <div
                key={loc.locality}
                className="bg-white border border-indigo-100/80 rounded-2xl p-4 shadow-xs space-y-2 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{loc.locality}</h4>
                      <p className="text-[11px] text-slate-400">{loc.count} gastos</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900 block">
                      {formatMoney(loc.total, trip.baseCurrency)}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{loc.percentage}%</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${loc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
