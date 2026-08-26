import React, { useState } from 'react';
import { Trip } from '../types';
import { formatMoney, formatDate } from '../utils/calculations';
import {
  Calendar,
  ChevronDown,
  Cloud,
  CloudCheck,
  CloudOff,
  Download,
  Plus,
  Settings,
  Smartphone,
  Table,
  Users,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  trips: Trip[];
  activeTrip: Trip | null;
  totalSpent: number;
  participantsCount: number;
  expensesCount: number;
  onSelectTrip: (tripId: string) => void;
  onOpenTripManager: () => void;
  onOpenNewTripModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenInstallGuide: () => void;
  isOnline: boolean;
  sheetsSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
}

export const Header: React.FC<HeaderProps> = ({
  trips,
  activeTrip,
  totalSpent,
  participantsCount,
  expensesCount,
  onSelectTrip,
  onOpenTripManager,
  onOpenNewTripModal,
  onOpenSheetsModal,
  onOpenInstallGuide,
  isOnline,
  sheetsSyncStatus = 'idle',
}) => {
  const [isTripMenuOpen, setIsTripMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-indigo-100 text-slate-800 transition-all shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top brand and status bar */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 text-white font-black text-sm">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-indigo-950">
                  TravelMoney
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Sheets
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons on top */}
          <div className="flex items-center gap-1.5">
            {/* Google Sheets Sync Pill */}
            <button
              id="header-sheets-btn"
              onClick={onOpenSheetsModal}
              title="Sincronización con Google Sheets"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Sheets</span>
              {sheetsSyncStatus === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
            </button>

            {/* Install PWA Guide Button */}
            <button
              id="header-install-btn"
              onClick={onOpenInstallGuide}
              title="Instalar en Móvil / PWA"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar PWA</span>
            </button>

            {/* Trip Settings */}
            <button
              id="header-trips-manager-btn"
              onClick={onOpenTripManager}
              title="Gestionar viajes"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition-all active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Trip Selector / Pill */}
        {activeTrip ? (
          <div className="relative">
            <div
              onClick={() => setIsTripMenuOpen(!isTripMenuOpen)}
              className={`cursor-pointer rounded-2xl p-4 bg-gradient-to-r ${activeTrip.coverGradient || 'from-indigo-600 via-indigo-700 to-rose-600'} text-white shadow-md shadow-indigo-500/10 transition-transform active:scale-[0.99] border border-white/10`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl filter drop-shadow">{activeTrip.coverEmoji || '✈️'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="font-extrabold text-base sm:text-lg leading-tight truncate text-white drop-shadow-sm">
                        {activeTrip.name}
                      </h1>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isTripMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/90 font-medium mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-white/80" />
                        {formatDate(activeTrip.startDate)} - {formatDate(activeTrip.endDate)}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/20 text-[11px] font-bold">
                        {activeTrip.baseCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Group Spend Badge */}
                <div className="text-right pl-2 shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/80 block">Gasto Total</span>
                  <span className="text-base sm:text-xl font-black text-white tracking-tight drop-shadow">
                    {formatMoney(totalSpent, activeTrip.baseCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dropdown for Trip Quick Switch */}
            {isTripMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTripMenuOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-indigo-100 rounded-2xl shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
                    Tus Viajes Guardados ({trips.length})
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {trips.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTrip(t.id);
                          setIsTripMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                          t.id === activeTrip.id
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl">{t.coverEmoji || '✈️'}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{t.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {formatDate(t.startDate)} • {t.baseCurrency}
                            </p>
                          </div>
                        </div>
                        {t.id === activeTrip.id && (
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 mt-2 pt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsTripMenuOpen(false);
                        onOpenNewTripModal();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nuevo Viaje
                    </button>
                    <button
                      onClick={() => {
                        setIsTripMenuOpen(false);
                        onOpenTripManager();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Todos los viajes
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl border border-indigo-100 text-center shadow-sm">
            <p className="text-sm text-slate-600 mb-2">No hay ningún viaje seleccionado.</p>
            <button
              onClick={onOpenNewTripModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-200"
            >
              <Plus className="w-4 h-4" /> Crear Primer Viaje
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
