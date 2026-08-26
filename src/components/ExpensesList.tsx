import React, { useState, useMemo } from 'react';
import { Expense, Trip, Participant, Category, PaymentType } from '../types';
import { formatMoney, formatDate, formatShortDate, getCurrencySymbol } from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';
import {
  Search,
  Filter,
  CreditCard,
  Banknote,
  MapPin,
  Calendar,
  Building,
  Edit2,
  Trash2,
  Users,
  X,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ExpensesListProps {
  trip: Trip;
  expenses: Expense[];
  participants: Participant[];
  categories: Category[];
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  trip,
  expenses,
  participants,
  categories,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const tripExpenses = useMemo(() => expenses.filter((e) => e.tripId === trip.id), [expenses, trip.id]);
  const tripParticipants = useMemo(() => participants.filter((p) => p.tripId === trip.id), [participants, trip.id]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterParticipantId, setFilterParticipantId] = useState<string>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterPaymentType, setFilterPaymentType] = useState<string>('all');
  const [filterLocality, setFilterLocality] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Participant Map & Category Map
  const partMap = useMemo(() => new Map(tripParticipants.map((p) => [p.id, p])), [tripParticipants]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Unique Localities for filtering
  const localities = useMemo(() => {
    const set = new Set<string>();
    tripExpenses.forEach((e) => {
      if (e.locality && e.locality.trim()) set.add(e.locality.trim());
    });
    return Array.from(set);
  }, [tripExpenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return tripExpenses.filter((e) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(term);
        const matchesNotes = e.notes?.toLowerCase().includes(term);
        const matchesLoc = e.locality?.toLowerCase().includes(term);
        const matchesPlace = e.locationName?.toLowerCase().includes(term);
        const payer = partMap.get(e.paidById)?.name.toLowerCase() || '';
        const matchesPayer = payer.includes(term);

        if (!matchesTitle && !matchesNotes && !matchesLoc && !matchesPlace && !matchesPayer) {
          return false;
        }
      }

      // Filter by Participant (either paid by or part of splits)
      if (filterParticipantId !== 'all') {
        const isPayer = e.paidById === filterParticipantId;
        const isInSplits = e.splits?.some((s) => s.participantId === filterParticipantId && s.isIncluded !== false);
        if (!isPayer && !isInSplits) return false;
      }

      // Filter by Category
      if (filterCategoryId !== 'all' && e.categoryId !== filterCategoryId) {
        return false;
      }

      // Filter by Payment Type
      if (filterPaymentType !== 'all' && e.paymentType !== filterPaymentType) {
        return false;
      }

      // Filter by Locality
      if (filterLocality !== 'all' && e.locality !== filterLocality) {
        return false;
      }

      return true;
    });
  }, [tripExpenses, searchTerm, filterParticipantId, filterCategoryId, filterPaymentType, filterLocality, partMap]);

  // Group filtered expenses by Date (sorted newest first)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach((e) => {
      const dateKey = e.date || 'Sin fecha';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(e);
    });

    return groups;
  }, [filteredExpenses]);

  const filteredTotalBase = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amountInBaseCurrency || 0), 0);
  }, [filteredExpenses]);

  const activeFiltersCount =
    (filterParticipantId !== 'all' ? 1 : 0) +
    (filterCategoryId !== 'all' ? 1 : 0) +
    (filterPaymentType !== 'all' ? 1 : 0) +
    (filterLocality !== 'all' ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterParticipantId('all');
    setFilterCategoryId('all');
    setFilterPaymentType('all');
    setFilterLocality('all');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="expenses-search-input"
              type="text"
              placeholder="Buscar por gasto, lugar, persona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Filter Panel */}
          <button
            id="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-indigo-600 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Row */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
            {/* Filter Participant */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Participante</label>
              <select
                id="filter-participant-select"
                value={filterParticipantId}
                onChange={(e) => setFilterParticipantId(e.target.value)}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Todos los participantes</option>
                {tripParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar || '👤'} {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Category */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoría</label>
              <select
                id="filter-category-select"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Payment Type */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tipo de pago</label>
              <select
                id="filter-paytype-select"
                value={filterPaymentType}
                onChange={(e) => setFilterPaymentType(e.target.value)}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Efectivo y Tarjeta</option>
                <option value="card">💳 Tarjeta</option>
                <option value="cash">💵 Efectivo</option>
              </select>
            </div>

            {/* Filter Locality */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Localidad</label>
              <select
                id="filter-locality-select"
                value={filterLocality}
                onChange={(e) => setFilterLocality(e.target.value)}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Todas las localidades</option>
                {localities.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset filters */}
            {activeFiltersCount > 0 && (
              <div className="col-span-2 sm:col-span-4 flex justify-end pt-1">
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold underline"
                >
                  Limpiar filtros activos ({activeFiltersCount})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Mostrando <strong className="text-slate-900">{filteredExpenses.length}</strong> de{' '}
            <strong className="text-slate-900">{tripExpenses.length}</strong> gastos
          </span>
          <span>
            Total: <strong className="text-indigo-950 font-black text-sm">{formatMoney(filteredTotalBase, trip.baseCurrency)}</strong>
          </span>
        </div>
      </div>

      {/* Expenses History List Grouped by Date */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 border border-indigo-100 shadow-sm text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl text-indigo-600">
            🧾
          </div>
          <h3 className="font-extrabold text-base text-indigo-950">No hay gastos que coincidan</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {tripExpenses.length === 0
              ? 'Aún no has registrado ningún gasto en este viaje. ¡Pulsa el botón central para añadir el primero!'
              : 'Prueba a cambiar o limpiar los filtros de búsqueda.'}
          </p>
          {tripExpenses.length === 0 ? (
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-200 active:scale-95 transition-all"
            >
              + Añadir Primer Gasto
            </button>
          ) : (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Ver todos los gastos
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {(Object.entries(groupedByDate) as [string, Expense[]][]).map(([dateStr, dateExpenses]) => {
            const dayTotal = dateExpenses.reduce((sum, e) => sum + e.amountInBaseCurrency, 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date header with daily total */}
                <div className="flex items-center justify-between px-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formatDate(dateStr)}</span>
                  </div>
                  <span className="font-medium text-slate-500">
                    Subtotal: <span className="font-bold text-slate-900">{formatMoney(dayTotal, trip.baseCurrency)}</span>
                  </span>
                </div>

                {/* Expense Cards */}
                <div className="space-y-2">
                  {dateExpenses.map((expense) => {
                    const cat = catMap.get(expense.categoryId) || {
                      name: 'Otros',
                      icon: 'Coins',
                      color: '#6366F1',
                    };
                    const payer = partMap.get(expense.paidById) || {
                      name: 'Desconocido',
                      avatar: '👤',
                      color: '#4F46E5',
                    };

                    const isForeignCurrency = expense.currency !== trip.baseCurrency;

                    return (
                      <div
                        key={expense.id}
                        onClick={() => onEditExpense(expense)}
                        className="group bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-200 rounded-2xl p-3.5 transition-all shadow-xs hover:shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3"
                      >
                        {/* Left: Category Icon & Main Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {expense.title}
                              </h4>
                            </div>

                            {/* Metadata row: Payer, Location, Payment Method */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                              {/* Payer badge */}
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                <span>{payer.avatar || '👤'}</span>
                                <span className="truncate max-w-[90px]">{payer.name}</span>
                              </span>

                              {/* Locality badge if exists */}
                              {expense.locality && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                                  <MapPin className="w-2.5 h-2.5 text-rose-500" />
                                  <span className="truncate max-w-[80px]">{expense.locality}</span>
                                </span>
                              )}

                              {/* Payment Type Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                  expense.paymentType === 'card'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}
                              >
                                {expense.paymentType === 'card' ? (
                                  <>
                                    <CreditCard className="w-2.5 h-2.5" /> Tarjeta
                                  </>
                                ) : (
                                  <>
                                    <Banknote className="w-2.5 h-2.5" /> Efectivo
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Optional note preview */}
                            {expense.notes && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5 italic">
                                "{expense.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount & Edit trigger */}
                        <div className="text-right shrink-0">
                          {/* Original Currency Amount */}
                          <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                            {formatMoney(expense.amount, expense.currency)}
                          </div>

                          {/* Base Currency equivalent if multi-currency */}
                          {isForeignCurrency && (
                            <div className="text-[11px] font-bold text-indigo-600">
                              ≈ {formatMoney(expense.amountInBaseCurrency, trip.baseCurrency)}
                            </div>
                          )}

                          {/* Splits count */}
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {expense.splits ? `${expense.splits.filter((s) => s.isIncluded !== false).length} pers.` : 'Todos'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
