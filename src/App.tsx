/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AppState,
  Trip,
  Participant,
  Category,
  Expense,
  Settlement,
  GoogleSheetsConfig,
} from './types';
import {
  loadAppState,
  saveAppState,
  resetToDemoData,
} from './utils/storage';
import { calculateTripSummary, calculateOptimalDebts } from './utils/calculations';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { ExpensesList } from './components/ExpensesList';
import { StatsPage } from './components/StatsPage';
import { SettlementPage } from './components/SettlementPage';
import { MoreMenuPage } from './components/MoreMenuPage';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { TripManager } from './components/TripManager';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { PARTICIPANT_COLORS } from './data/initialData';

export default function App() {
  // Load state from local storage
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<NavTab>('expenses');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Online / Offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to localStorage on every change
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Active Trip resolution
  const activeTrip = useMemo(() => {
    if (!appState.activeTripId) return appState.trips[0] || null;
    return appState.trips.find((t) => t.id === appState.activeTripId) || appState.trips[0] || null;
  }, [appState.trips, appState.activeTripId]);

  // Calculate current trip stats
  const tripSummary = useMemo(() => {
    if (!activeTrip) return { totalSpentBase: 0, expensesCount: 0, participantsCount: 0 };
    return calculateTripSummary(
      activeTrip,
      appState.participants,
      appState.expenses,
      appState.settlements
    );
  }, [activeTrip, appState.participants, appState.expenses, appState.settlements]);

  // Calculate pending debt settlements count
  const pendingDebts = useMemo(() => {
    if (!activeTrip) return [];
    return calculateOptimalDebts(
      activeTrip,
      appState.participants,
      appState.expenses,
      appState.settlements
    );
  }, [activeTrip, appState.participants, appState.expenses, appState.settlements]);

  // Handler: Select Trip
  const handleSelectTrip = (tripId: string) => {
    setAppState((prev) => ({
      ...prev,
      activeTripId: tripId,
    }));
  };

  // Handler: Add or Edit Expense
  const handleSaveExpense = (savedExpense: Expense) => {
    setAppState((prev) => {
      const exists = prev.expenses.some((e) => e.id === savedExpense.id);
      const updatedExpenses = exists
        ? prev.expenses.map((e) => (e.id === savedExpense.id ? savedExpense : e))
        : [savedExpense, ...prev.expenses];

      return {
        ...prev,
        expenses: updatedExpenses,
      };
    });
  };

  // Handler: Delete Expense
  const handleDeleteExpense = (expenseId: string) => {
    setAppState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
  };

  // Handler: Add Trip
  const handleAddTrip = (newTrip: Trip, initialParticipantNames: string[]) => {
    const newParticipants: Participant[] = initialParticipantNames.map((name, idx) => ({
      id: `part-${Date.now()}-${idx}`,
      tripId: newTrip.id,
      name: name,
      avatar: ['👨🏻', '👩🏻', '🧔🏻', '👱🏼‍♀️', '👩🏽', '👨🏻‍🦱'][idx % 6] || '👤',
      color: PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length],
      weight: 1,
    }));

    setAppState((prev) => ({
      ...prev,
      trips: [newTrip, ...prev.trips],
      activeTripId: newTrip.id,
      participants: [...prev.participants, ...newParticipants],
    }));

    setActiveTab('expenses');
  };

  // Handler: Update Trip
  const handleUpdateTrip = (updatedTrip: Trip) => {
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)),
    }));
  };

  // Handler: Delete Trip
  const handleDeleteTrip = (tripId: string) => {
    setAppState((prev) => {
      const remainingTrips = prev.trips.filter((t) => t.id !== tripId);
      const nextActiveId = remainingTrips.length > 0 ? remainingTrips[0].id : null;
      return {
        ...prev,
        trips: remainingTrips,
        activeTripId: nextActiveId,
        participants: prev.participants.filter((p) => p.tripId !== tripId),
        expenses: prev.expenses.filter((e) => e.tripId !== tripId),
        settlements: prev.settlements.filter((s) => s.tripId !== tripId),
      };
    });
  };

  // Handler: Participants
  const handleAddParticipant = (p: Participant) => {
    setAppState((prev) => ({
      ...prev,
      participants: [...prev.participants, p],
    }));
  };

  const handleUpdateParticipant = (p: Participant) => {
    setAppState((prev) => ({
      ...prev,
      participants: prev.participants.map((item) => (item.id === p.id ? p : item)),
    }));
  };

  const handleDeleteParticipant = (pId: string) => {
    setAppState((prev) => ({
      ...prev,
      participants: prev.participants.filter((item) => item.id !== pId),
      expenses: prev.expenses.map((e) => {
        if (e.splits) {
          return {
            ...e,
            splits: e.splits.filter((s) => s.participantId !== pId),
          };
        }
        return e;
      }),
    }));
  };

  // Handler: Categories
  const handleAddCategory = (c: Category) => {
    setAppState((prev) => ({
      ...prev,
      categories: [...prev.categories, c],
    }));
  };

  const handleUpdateCategory = (c: Category) => {
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.map((item) => (item.id === c.id ? c : item)),
    }));
  };

  const handleDeleteCategory = (cId: string) => {
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item.id !== cId),
    }));
  };

  // Handler: Settlements
  const handleAddSettlement = (s: Settlement) => {
    setAppState((prev) => ({
      ...prev,
      settlements: [s, ...prev.settlements],
    }));
  };

  const handleDeleteSettlement = (sId: string) => {
    setAppState((prev) => ({
      ...prev,
      settlements: prev.settlements.filter((item) => item.id !== sId),
    }));
  };

  // Handler: Google Sheets Config
  const handleUpdateSheetsConfig = (cfg: GoogleSheetsConfig) => {
    setAppState((prev) => ({
      ...prev,
      sheetsConfig: cfg,
    }));
  };

  // Handler: Restore State
  const handleRestoreState = (newState: AppState) => {
    setAppState(newState);
  };

  // Handler: Reset Demo Data
  const handleResetDemoData = () => {
    const demo = resetToDemoData();
    setAppState(demo);
  };

  const currentTripExpensesCount = activeTrip
    ? appState.expenses.filter((e) => e.tripId === activeTrip.id).length
    : 0;

  return (
    <div className="min-h-screen bg-indigo-50/50 text-slate-900 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header
        trips={appState.trips}
        activeTrip={activeTrip}
        totalSpent={tripSummary.totalSpentBase}
        participantsCount={tripSummary.participantsCount}
        expensesCount={tripSummary.expensesCount}
        onSelectTrip={handleSelectTrip}
        onOpenTripManager={() => setIsTripModalOpen(true)}
        onOpenNewTripModal={() => setIsTripModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        isOnline={isOnline}
        sheetsSyncStatus={appState.sheetsConfig?.syncStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5">
        {activeTrip ? (
          <>
            {/* 1. GASTOS TAB (Historial) */}
            {activeTab === 'expenses' && (
              <ExpensesList
                trip={activeTrip}
                expenses={appState.expenses}
                participants={appState.participants}
                categories={appState.categories}
                onOpenAddExpense={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                onEditExpense={(exp) => {
                  setExpenseToEdit(exp);
                  setIsExpenseModalOpen(true);
                }}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {/* 2. ESTADÍSTICAS TAB (Gráficos y Clasificación) */}
            {activeTab === 'stats' && (
              <StatsPage
                trip={activeTrip}
                participants={appState.participants}
                expenses={appState.expenses}
                categories={appState.categories}
                settlements={appState.settlements}
              />
            )}

            {/* 3. SALDOS Y LIQUIDACIÓN TAB */}
            {activeTab === 'settlement' && (
              <SettlementPage
                trip={activeTrip}
                participants={appState.participants}
                expenses={appState.expenses}
                settlements={appState.settlements}
                onAddSettlement={handleAddSettlement}
                onDeleteSettlement={handleDeleteSettlement}
              />
            )}

            {/* 4. AJUSTES / MÁS TAB */}
            {activeTab === 'more' && (
              <MoreMenuPage
                trip={activeTrip}
                trips={appState.trips}
                participants={appState.participants}
                categories={appState.categories}
                expenses={appState.expenses}
                onSelectTrip={handleSelectTrip}
                onAddTrip={handleAddTrip}
                onUpdateTrip={handleUpdateTrip}
                onDeleteTrip={handleDeleteTrip}
                onResetDemoData={handleResetDemoData}
                onAddParticipant={handleAddParticipant}
                onUpdateParticipant={handleUpdateParticipant}
                onDeleteParticipant={handleDeleteParticipant}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
                onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16 space-y-4 bg-white rounded-[2rem] border border-indigo-100 shadow-sm p-8 max-w-md mx-auto my-8">
            <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              ✈️
            </div>
            <h2 className="text-xl font-black text-indigo-950">No tienes viajes activos</h2>
            <p className="text-sm text-slate-500">Crea tu primer viaje para empezar a dividir gastos fácilmente con amigos o familiares.</p>
            <button
              onClick={() => setIsTripModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-95"
            >
              Crear mi primer viaje
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile & Desktop */}
      {activeTrip && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddExpense={() => {
            setExpenseToEdit(null);
            setIsExpenseModalOpen(true);
          }}
          expensesCount={currentTripExpensesCount}
          pendingDebtsCount={pendingDebts.length}
        />
      )}

      {/* Expense Form Modal (Add / Edit) */}
      {activeTrip && (
        <ExpenseFormModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          trip={activeTrip}
          participants={appState.participants}
          categories={appState.categories}
          expenseToEdit={expenseToEdit}
        />
      )}

      {/* Trips Manager Modal */}
      {activeTrip && (
        <TripManager
          isModalOpen={isTripModalOpen}
          onCloseModal={() => setIsTripModalOpen(false)}
          trips={appState.trips}
          activeTripId={activeTrip.id}
          participants={appState.participants}
          onSelectTrip={(id) => {
            handleSelectTrip(id);
            setIsTripModalOpen(false);
          }}
          onAddTrip={(trip, members) => {
            handleAddTrip(trip, members);
            setIsTripModalOpen(false);
          }}
          onUpdateTrip={handleUpdateTrip}
          onDeleteTrip={handleDeleteTrip}
          onResetDemoData={handleResetDemoData}
        />
      )}

      {/* Google Sheets Sync Hub Modal */}
      {activeTrip && (
        <GoogleSheetsModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
          trip={activeTrip}
          appState={appState}
          onUpdateSheetsConfig={handleUpdateSheetsConfig}
          onRestoreState={handleRestoreState}
        />
      )}

      {/* Install Mobile PWA Guide Modal */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />
    </div>
  );
}
