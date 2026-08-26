import React, { useState } from 'react';
import { Trip, Participant } from '../types';
import { POPULAR_CURRENCIES, VIBRANT_GRADIENTS } from '../data/initialData';
import { formatDate } from '../utils/calculations';
import {
  Compass,
  Plus,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  activeTripId: string | null;
  participants: Participant[];
  onSelectTrip: (tripId: string) => void;
  onAddTrip: (trip: Trip, initialParticipantNames: string[]) => void;
  onUpdateTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onResetDemoData: () => void;
  isModalOpen?: boolean;
  onCloseModal?: () => void;
}

const EMOJI_TRIP_OPTIONS = ['✈️', '🏯', '🍕', '🏝️', '🏔️', '🛵', '🚗', '⛺', '🚢', '🗽', '🏰', '🌴', '🎒'];

export const TripManager: React.FC<TripManagerProps> = ({
  trips,
  activeTripId,
  participants,
  onSelectTrip,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
  onResetDemoData,
  isModalOpen,
  onCloseModal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['EUR']);
  const [coverEmoji, setCoverEmoji] = useState('✈️');
  const [coverGradient, setCoverGradient] = useState(VIBRANT_GRADIENTS[0]);
  const [initialMembers, setInitialMembers] = useState('Yo, Carlos, Laura');

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    setName('');
    setDescription('');
    setStartDate(today);
    setEndDate(nextWeek);
    setBaseCurrency('EUR');
    setSelectedCurrencies(['EUR']);
    setCoverEmoji(EMOJI_TRIP_OPTIONS[Math.floor(Math.random() * EMOJI_TRIP_OPTIONS.length)]);
    setCoverGradient(VIBRANT_GRADIENTS[Math.floor(Math.random() * VIBRANT_GRADIENTS.length)]);
    setInitialMembers('Yo, ');
    setEditingTrip(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (t: Trip) => {
    setEditingTrip(t);
    setName(t.name);
    setDescription(t.description || '');
    setStartDate(t.startDate);
    setEndDate(t.endDate);
    setBaseCurrency(t.baseCurrency);
    setSelectedCurrencies(t.currencies || [t.baseCurrency]);
    setCoverEmoji(t.coverEmoji || '✈️');
    setCoverGradient(t.coverGradient || VIBRANT_GRADIENTS[0]);
    setIsAdding(true);
  };

  const toggleCurrencySelection = (code: string) => {
    if (code === baseCurrency) return; // Base currency is always included
    if (selectedCurrencies.includes(code)) {
      setSelectedCurrencies(selectedCurrencies.filter((c) => c !== code));
    } else {
      setSelectedCurrencies([...selectedCurrencies, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Introduce un nombre para el viaje');
      return;
    }

    const rates: Record<string, number> = { [baseCurrency]: 1.0 };
    selectedCurrencies.forEach((c) => {
      if (c !== baseCurrency) {
        const found = POPULAR_CURRENCIES.find((curr) => curr.code === c);
        rates[c] = found?.defaultRateToBase || 1.0;
      }
    });

    if (editingTrip) {
      onUpdateTrip({
        ...editingTrip,
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        baseCurrency: baseCurrency,
        currencies: Array.from(new Set([baseCurrency, ...selectedCurrencies])),
        exchangeRates: { ...rates, ...(editingTrip.exchangeRates || {}) },
        coverEmoji: coverEmoji,
        coverGradient: coverGradient,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        baseCurrency: baseCurrency,
        currencies: Array.from(new Set([baseCurrency, ...selectedCurrencies])),
        exchangeRates: rates,
        coverEmoji: coverEmoji,
        coverGradient: coverGradient,
        createdAt: new Date().toISOString(),
      };

      const memberNames = initialMembers
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      onAddTrip(newTrip, memberNames.length > 0 ? memberNames : ['Yo']);
    }

    setIsAdding(false);
    setEditingTrip(null);
  };

  const handleDeleteClick = (t: Trip) => {
    setTripToDelete(t);
  };

  const handleConfirmDelete = () => {
    if (!tripToDelete) return;
    onDeleteTrip(tripToDelete.id);
    setTripToDelete(null);
  };

  const content = (
    <div className="space-y-5">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-indigo-950 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            Mis Viajes ({trips.length})
          </h3>
          <p className="text-xs text-slate-500">Crea viajes de cualquier fecha y duración</p>
        </div>

        {!isAdding && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Viaje</span>
          </button>
        )}
      </div>

      {/* Add / Edit Trip Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-3xl bg-white border border-indigo-100 shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-indigo-950">
              {editingTrip ? 'Editar Viaje' : 'Crear Nuevo Viaje'}
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre del Viaje <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Ruta por la Costa Brava, Viaje a Londres..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Descripción opcional
            </label>
            <input
              type="text"
              placeholder="Ej: Vacaciones de verano con amigos"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Base Currency */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Moneda Principal del Viaje
            </label>
            <select
              value={baseCurrency}
              onChange={(e) => {
                const newB = e.target.value;
                setBaseCurrency(newB);
                if (!selectedCurrencies.includes(newB)) {
                  setSelectedCurrencies([...selectedCurrencies, newB]);
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.name} - {c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Other currencies used in this trip */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Otras monedas que se usarán en el viaje (Multidivisa)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              {POPULAR_CURRENCIES.map((c) => {
                const isSelected = selectedCurrencies.includes(c.code) || c.code === baseCurrency;
                return (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => toggleCurrencySelection(c.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.flag} {c.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial participants for new trip */}
          {!editingTrip && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Participantes iniciales (separados por coma)
              </label>
              <input
                type="text"
                placeholder="Ej: Yo, Carlos, Laura, Marcos..."
                value={initialMembers}
                onChange={(e) => setInitialMembers(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          {/* Emoji & Gradient */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Icono y Color de Portada
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_TRIP_OPTIONS.map((emo) => (
                <button
                  type="button"
                  key={emo}
                  onClick={() => setCoverEmoji(emo)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                    coverEmoji === emo ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {VIBRANT_GRADIENTS.map((grad, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCoverGradient(grad)}
                  className={`w-8 h-6 rounded-md bg-gradient-to-r ${grad} ${
                    coverGradient === grad ? 'ring-2 ring-indigo-600 scale-105' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md shadow-rose-200 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingTrip ? 'Guardar Cambios' : 'Crear Viaje'}
            </button>
          </div>
        </form>
      )}

      {/* Trips Cards List */}
      <div className="space-y-3">
        {trips.map((t) => {
          const tripParts = participants.filter((p) => p.tripId === t.id);
          const isActive = t.id === activeTripId;

          return (
            <div
              key={t.id}
              className={`rounded-3xl p-4 border transition-all shadow-xs ${
                isActive
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-100'
                  : 'bg-white border-indigo-100 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  onClick={() => onSelectTrip(t.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${t.coverGradient || 'from-rose-500 to-amber-400'} flex items-center justify-center text-2xl shadow-xs shrink-0`}
                  >
                    {t.coverEmoji || '✈️'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 truncate">{t.name}</h4>
                      {isActive && (
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Activo
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {formatDate(t.startDate)} - {formatDate(t.endDate)}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-600">{tripParts.length} participantes</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                        {t.baseCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => onSelectTrip(t.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all"
                    >
                      Abrir
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                    title="Editar viaje"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(t)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all active:scale-95"
                    title="Eliminar viaje"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Demo Data Button */}
      <div className="pt-4 border-t border-indigo-100 flex justify-center">
        <button
          type="button"
          onClick={() => setShowResetDemoConfirm(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restablecer datos de prueba</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-indigo-100 text-slate-900 w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-indigo-950">Gestionar Viajes</h3>
              <button onClick={onCloseModal} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            {content}
          </div>
        </div>
      ) : (
        content
      )}

      {/* In-App Delete Trip Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white border border-rose-100 text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-base text-slate-900">¿Eliminar este viaje?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Estás a punto de eliminar el viaje <strong className="text-slate-900">"{tripToDelete.name}"</strong> y todos sus gastos, cuentas y participantes asociados.
              </p>
              {trips.length <= 1 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                  ℹ️ Al ser tu único viaje, se creará automáticamente un nuevo viaje limpio.
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-100 active:scale-95 transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Reset Demo Confirmation Modal */}
      {showResetDemoConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white border border-indigo-100 text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-base text-slate-900">¿Restablecer datos de prueba?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se restaurarán los viajes de ejemplo (Japón y Roma) con sus gastos e historiales.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetDemoConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetDemoConfirm(false);
                  onResetDemoData();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 active:scale-95 transition-all"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
