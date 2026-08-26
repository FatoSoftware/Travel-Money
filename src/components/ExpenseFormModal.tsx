import React, { useState, useEffect } from 'react';
import { Expense, Trip, Participant, Category, PaymentType, SplitType, ParticipantSplit } from '../types';
import { POPULAR_CURRENCIES } from '../data/initialData';
import { CategoryIcon } from './CategoryIcon';
import { getCurrencySymbol, formatMoney } from '../utils/calculations';
import {
  X,
  CreditCard,
  Banknote,
  Calendar,
  MapPin,
  Building,
  FileText,
  Trash2,
  Check,
  ArrowRightLeft,
  Users,
  Sparkles,
} from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  trip: Trip;
  participants: Participant[];
  categories: Category[];
  expenseToEdit?: Expense | null;
}

const QUICK_SUGGESTIONS = [
  'Cena',
  'Comida',
  'Desayuno',
  'Hotel',
  'Taxi / Uber',
  'Supermercado',
  'Entradas',
  'Gasolina',
  'Café y snacks',
  'Souvenirs',
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  trip,
  participants,
  categories,
  expenseToEdit,
}) => {
  const tripParticipants = participants.filter((p) => p.tripId === trip.id);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(trip.baseCurrency || 'EUR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [paidById, setPaidById] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [categoryId, setCategoryId] = useState<string>('');
  const [locationName, setLocationName] = useState('');
  const [locality, setLocality] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCurrency(expenseToEdit.currency);
      setExchangeRate(expenseToEdit.exchangeRate || 1);
      setPaidById(expenseToEdit.paidById);
      setPaymentType(expenseToEdit.paymentType);
      setCategoryId(expenseToEdit.categoryId);
      setLocationName(expenseToEdit.locationName || '');
      setLocality(expenseToEdit.locality || '');
      setDate(expenseToEdit.date);
      setNotes(expenseToEdit.notes || '');
      setSplitType(expenseToEdit.splitType || 'equal');

      if (expenseToEdit.splits && expenseToEdit.splits.length > 0) {
        const included = expenseToEdit.splits
          .filter((s) => s.isIncluded !== false)
          .map((s) => s.participantId);
        setIncludedParticipantIds(included);

        const amounts: Record<string, string> = {};
        expenseToEdit.splits.forEach((s) => {
          amounts[s.participantId] = s.amount.toString();
        });
        setCustomAmounts(amounts);
      } else {
        setIncludedParticipantIds(tripParticipants.map((p) => p.id));
      }
    } else {
      // New Expense Defaults
      setTitle('');
      setAmount('');
      const defaultCurr = trip.currencies && trip.currencies.length > 0 ? trip.currencies[0] : trip.baseCurrency;
      setCurrency(defaultCurr);
      const rate = trip.exchangeRates?.[defaultCurr] || 1;
      setExchangeRate(rate);
      setPaidById(tripParticipants[0]?.id || '');
      setPaymentType('card');
      setCategoryId(categories[0]?.id || 'cat-food');
      setLocationName('');
      setLocality('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setNotes('');
      setSplitType('equal');
      setIncludedParticipantIds(tripParticipants.map((p) => p.id));
      setCustomAmounts({});
    }
  }, [expenseToEdit, isOpen, trip]);

  // When currency changes, update exchange rate
  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (newCurr === trip.baseCurrency) {
      setExchangeRate(1);
    } else if (trip.exchangeRates?.[newCurr]) {
      setExchangeRate(trip.exchangeRates[newCurr]);
    } else {
      const found = POPULAR_CURRENCIES.find((c) => c.code === newCurr);
      setExchangeRate(found?.defaultRateToBase || 1);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const computedBaseAmount = Number((parsedAmount * exchangeRate).toFixed(2));

  const toggleParticipantInclusion = (id: string) => {
    if (includedParticipantIds.includes(id)) {
      if (includedParticipantIds.length === 1) return; // Must have at least 1 person
      setIncludedParticipantIds(includedParticipantIds.filter((pId) => pId !== id));
    } else {
      setIncludedParticipantIds([...includedParticipantIds, id]);
    }
  };

  const handleSelectAllParticipants = () => {
    setIncludedParticipantIds(tripParticipants.map((p) => p.id));
  };

  const handleCustomAmountChange = (participantId: string, val: string) => {
    setCustomAmounts({ ...customAmounts, [participantId]: val });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor introduce un título para el gasto');
      return;
    }
    if (parsedAmount <= 0) {
      alert('Por favor introduce un importe válido');
      return;
    }
    if (!paidById) {
      alert('Por favor selecciona quién pagó el gasto');
      return;
    }

    // Build splits array
    let splits: ParticipantSplit[] = [];
    if (splitType === 'equal') {
      const count = includedParticipantIds.length || 1;
      const shareAmount = parsedAmount / count;
      const shareBaseAmount = computedBaseAmount / count;

      splits = tripParticipants.map((p) => {
        const isInc = includedParticipantIds.includes(p.id);
        return {
          participantId: p.id,
          amount: isInc ? Number(shareAmount.toFixed(2)) : 0,
          amountInBase: isInc ? Number(shareBaseAmount.toFixed(2)) : 0,
          isIncluded: isInc,
        };
      });
    } else {
      // custom_amounts
      splits = tripParticipants.map((p) => {
        const customVal = parseFloat(customAmounts[p.id] || '0') || 0;
        return {
          participantId: p.id,
          amount: customVal,
          amountInBase: Number((customVal * exchangeRate).toFixed(2)),
          isIncluded: customVal > 0,
        };
      });
    }

    const newExpense: Expense = {
      id: expenseToEdit ? expenseToEdit.id : `exp-${Date.now()}`,
      tripId: trip.id,
      title: title.trim(),
      amount: parsedAmount,
      currency: currency,
      exchangeRate: exchangeRate,
      amountInBaseCurrency: computedBaseAmount,
      paidById: paidById,
      paymentType: paymentType,
      categoryId: categoryId || 'cat-general',
      locationName: locationName.trim() || undefined,
      locality: locality.trim() || undefined,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      splitType: splitType,
      splits: splits,
      createdAt: expenseToEdit ? expenseToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newExpense);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-indigo-100 text-slate-900 w-full max-w-lg max-h-[92vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shadow-xs">
              💰
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-indigo-950">
                {expenseToEdit ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <p className="text-xs text-slate-400">Viaje: {trip.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick Suggestions Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Sugerencias rápidas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => {
                    setTitle(sug);
                    // auto pick category if matching
                    if (sug.includes('Cena') || sug.includes('Comida') || sug.includes('Desayuno') || sug.includes('Café')) {
                      setCategoryId('cat-food');
                    } else if (sug.includes('Hotel')) {
                      setCategoryId('cat-stay');
                    } else if (sug.includes('Taxi') || sug.includes('Metro')) {
                      setCategoryId('cat-transport');
                    } else if (sug.includes('Super')) {
                      setCategoryId('cat-market');
                    } else if (sug.includes('Entradas')) {
                      setCategoryId('cat-leisure');
                    } else if (sug.includes('Gasolina')) {
                      setCategoryId('cat-fuel');
                    }
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-medium transition-all active:scale-95"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Título / Concepto <span className="text-rose-500">*</span>
            </label>
            <input
              id="expense-title-input"
              type="text"
              required
              placeholder="Ej: Cena en Trattoria, Billete de tren, Hotel..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-base font-semibold"
            />
          </div>

          {/* Amount & Currency Multi-currency box */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Importe y Moneda <span className="text-rose-500">*</span>
              </label>
              {currency !== trip.baseCurrency && (
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  Multidivisa
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Amount input */}
              <div className="relative flex-1">
                <input
                  id="expense-amount-input"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-4 pr-3 py-3 rounded-xl bg-white border border-slate-200 text-slate-950 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Currency Selector */}
              <select
                id="expense-currency-select"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="py-3.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Currency conversion box if not in base currency */}
            {currency !== trip.baseCurrency && (
              <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1 font-medium">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                    Equivalente en moneda base:
                  </span>
                  <span className="text-base font-extrabold text-indigo-600">
                    ≈ {formatMoney(computedBaseAmount, trip.baseCurrency)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Tipo de cambio: 1 {currency} =</span>
                  <input
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    className="w-24 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-xs"
                  />
                  <span className="text-slate-500">{trip.baseCurrency}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Type: Efectivo vs Tarjeta */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Tipo de Pago <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="expense-paytype-card"
                onClick={() => setPaymentType('card')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  paymentType === 'card'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Tarjeta
              </button>
              <button
                type="button"
                id="expense-paytype-cash"
                onClick={() => setPaymentType('cash')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  paymentType === 'cash'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Efectivo
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Categoría <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-slate-900 ring-1 ring-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={14} />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payer: Who paid? */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              ¿Quién pagó? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tripParticipants.map((p) => {
                const isSelected = paidById === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPaidById(p.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-slate-900 ring-1 ring-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{p.avatar || '👤'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      {isSelected && <span className="text-[10px] text-indigo-600 font-bold">Pagador</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split / Reparto */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                ¿Para quién es el gasto?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllParticipants}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold underline"
                >
                  Seleccionar todos
                </button>
              </div>
            </div>

            {/* Split Mode Selector */}
            <div className="flex gap-1 p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  splitType === 'equal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Partes iguales
              </button>
              <button
                type="button"
                onClick={() => setSplitType('custom_amounts')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  splitType === 'custom_amounts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Importe personalizado
              </button>
            </div>

            {/* Participants list for splitting */}
            <div className="space-y-2">
              {tripParticipants.map((p) => {
                const isInc = includedParticipantIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isInc
                        ? 'bg-white border-indigo-100 text-slate-900 shadow-xs'
                        : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div
                      onClick={() => toggleParticipantInclusion(p.id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 select-none"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isInc ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {isInc && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-base">{p.avatar || '👤'}</span>
                      <span className="text-xs font-bold">{p.name}</span>
                    </div>

                    {splitType === 'equal' ? (
                      isInc && (
                        <span className="text-xs font-bold text-indigo-600">
                          {formatMoney(
                            parsedAmount / (includedParticipantIds.length || 1),
                            currency
                          )}
                        </span>
                      )
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={customAmounts[p.id] || ''}
                          onChange={(e) => handleCustomAmountChange(p.id, e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-right text-xs font-bold text-slate-900"
                        />
                        <span className="text-xs text-slate-500">{getCurrencySymbol(currency)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location & Locality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                Lugar / Establecimiento
              </label>
              <input
                type="text"
                placeholder="Ej: Ichiran Ramen, Carrefour..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Localidad / Ciudad
              </label>
              <input
                type="text"
                placeholder="Ej: Roma, Tokio, Madrid..."
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha del gasto
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Notas opcionales
              </label>
              <input
                type="text"
                placeholder="Detalles adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {expenseToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Seguro que deseas eliminar este gasto?')) {
                    onDelete(expenseToEdit.id);
                    onClose();
                  }
                }}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center gap-1.5 text-xs font-bold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                id="expense-submit-btn"
                type="submit"
                className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-extrabold shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                {expenseToEdit ? 'Guardar Cambios' : 'Añadir Gasto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
