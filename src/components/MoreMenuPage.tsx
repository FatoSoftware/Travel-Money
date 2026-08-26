import React, { useState } from 'react';
import { Trip, Participant, Expense, Category, GoogleSheetsConfig } from '../types';
import { ParticipantsManager } from './ParticipantsManager';
import { CategoriesManager } from './CategoriesManager';
import { TripManager } from './TripManager';
import {
  Compass,
  Users,
  Layers,
  Table,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';

interface MoreMenuPageProps {
  trip: Trip;
  trips: Trip[];
  participants: Participant[];
  categories: Category[];
  expenses: Expense[];
  onSelectTrip: (tripId: string) => void;
  onAddTrip: (trip: Trip, initialParticipantNames: string[]) => void;
  onUpdateTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onResetDemoData: () => void;
  onAddParticipant: (p: Participant) => void;
  onUpdateParticipant: (p: Participant) => void;
  onDeleteParticipant: (pId: string) => void;
  onAddCategory: (c: Category) => void;
  onUpdateCategory: (c: Category) => void;
  onDeleteCategory: (cId: string) => void;
  onOpenSheetsModal: () => void;
  onOpenInstallGuide: () => void;
}

type SubView = 'menu' | 'trips' | 'participants' | 'categories';

export const MoreMenuPage: React.FC<MoreMenuPageProps> = ({
  trip,
  trips,
  participants,
  categories,
  expenses,
  onSelectTrip,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
  onResetDemoData,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onOpenSheetsModal,
  onOpenInstallGuide,
}) => {
  const [currentSubView, setCurrentSubView] = useState<SubView>('menu');

  if (currentSubView === 'trips') {
    return (
      <div className="space-y-4 pb-24">
        <button
          onClick={() => setCurrentSubView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 px-1 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú de Ajustes</span>
        </button>
        <TripManager
          trips={trips}
          activeTripId={trip.id}
          participants={participants}
          onSelectTrip={(id) => {
            onSelectTrip(id);
            setCurrentSubView('menu');
          }}
          onAddTrip={onAddTrip}
          onUpdateTrip={onUpdateTrip}
          onDeleteTrip={onDeleteTrip}
          onResetDemoData={onResetDemoData}
        />
      </div>
    );
  }

  if (currentSubView === 'participants') {
    return (
      <div className="space-y-4 pb-24">
        <button
          onClick={() => setCurrentSubView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 px-1 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú de Ajustes</span>
        </button>
        <ParticipantsManager
          trip={trip}
          participants={participants}
          expenses={expenses}
          onAddParticipant={onAddParticipant}
          onUpdateParticipant={onUpdateParticipant}
          onDeleteParticipant={onDeleteParticipant}
        />
      </div>
    );
  }

  if (currentSubView === 'categories') {
    return (
      <div className="space-y-4 pb-24">
        <button
          onClick={() => setCurrentSubView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 px-1 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú de Ajustes</span>
        </button>
        <CategoriesManager
          categories={categories}
          expenses={expenses}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Menu Header Card */}
      <div className="bg-white border border-indigo-100 rounded-[2rem] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-lg">
            ⚙️
          </div>
          <div>
            <h3 className="font-extrabold text-base text-indigo-950">Configuración y Gestión</h3>
            <p className="text-xs text-slate-500">Personaliza tus viajes, personas y base de datos</p>
          </div>
        </div>
      </div>

      {/* Navigation Options List */}
      <div className="space-y-2.5">
        {/* 1. Gestión de Viajes */}
        <button
          id="menu-trips-btn"
          onClick={() => setCurrentSubView('trips')}
          className="w-full bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 flex items-center justify-between transition-all group active:scale-[0.99] shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Mis Viajes
              </h4>
              <p className="text-xs text-slate-500">
                {trips.length} viajes registrados • Crear o cambiar viaje activo
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>

        {/* 2. Participantes */}
        <button
          id="menu-participants-btn"
          onClick={() => setCurrentSubView('participants')}
          className="w-full bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 flex items-center justify-between transition-all group active:scale-[0.99] shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Participantes del Viaje
              </h4>
              <p className="text-xs text-slate-500">
                {participants.filter((p) => p.tripId === trip.id).length} miembros en "{trip.name}"
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>

        {/* 3. Categorías */}
        <button
          id="menu-categories-btn"
          onClick={() => setCurrentSubView('categories')}
          className="w-full bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 flex items-center justify-between transition-all group active:scale-[0.99] shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Categorías de Gastos
              </h4>
              <p className="text-xs text-slate-500">{categories.length} categorías con iconos y colores</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>

        {/* 4. Base de Datos Google Sheets */}
        <button
          id="menu-sheets-btn"
          onClick={onOpenSheetsModal}
          className="w-full bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 flex items-center justify-between transition-all group active:scale-[0.99] shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                Base de Datos Google Sheets
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  Sync
                </span>
              </h4>
              <p className="text-xs text-slate-500">Exportar CSV, sincronización Apps Script y respaldos</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>

        {/* 5. Instalar en Móvil / PWA */}
        <button
          id="menu-install-guide-btn"
          onClick={onOpenInstallGuide}
          className="w-full bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 flex items-center justify-between transition-all group active:scale-[0.99] shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Instalar en tu Móvil (PWA)
              </h4>
              <p className="text-xs text-slate-500">Guía paso a paso para Android e iPhone</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>
      </div>

      {/* Info & Offline Benefits Footer Card */}
      <div className="p-4 rounded-3xl bg-white border border-indigo-100 shadow-xs space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacidad y Rendimiento Offline</span>
        </div>
        <p>
          Travel Money funciona con almacenamiento local instantáneo en tu dispositivo. Tus datos no se comparten con terceros y puedes usarla sin cobertura ni datos móviles durante tus viajes.
        </p>
      </div>
    </div>
  );
};
