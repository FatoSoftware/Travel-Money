/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  addTombstone,
  removeTombstone,
} from './utils/storage';
import { calculateTripSummary, calculateOptimalDebts } from './utils/calculations';
import {
  pullFromGoogleSheets,
  pushToGoogleSheets,
  performTwoWaySync,
  smartMergeStates,
} from './utils/sheetsSync';
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
import { CheckCircle2 } from 'lucide-react';

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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>(
    appState.sheetsConfig?.syncStatus || 'idle'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ref to track latest state for async sync calls without stale closures
  const appStateRef = useRef<AppState>(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const isSyncInProgress = useRef(false);
  const pendingPushTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  // Reconnection Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const webhook = appStateRef.current.sheetsConfig?.webhookUrl?.trim();
      if (webhook && appStateRef.current.sheetsConfig?.autoSync !== false && !isSyncInProgress.current) {
        setSyncStatus('syncing');
        isSyncInProgress.current = true;
        performTwoWaySync(webhook, appStateRef.current)
          .then((res) => {
            if (res.success && res.mergedState) {
              setAppState(res.mergedState);
              setSyncStatus('success');
            }
          })
          .catch(() => setSyncStatus('error'))
          .finally(() => {
            isSyncInProgress.current = false;
          });
      }
    };
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

  // 1. Initial Mount: Check URL for #sync= or ?sync= to connect other devices in 1-click
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    let detectedUrl = '';

    if (hash.includes('sync=')) {
      const params = new URLSearchParams(hash.substring(1));
      detectedUrl = params.get('sync') || '';
    } else if (search.includes('sync=')) {
      const params = new URLSearchParams(search);
      detectedUrl = params.get('sync') || '';
    }

    if (detectedUrl && detectedUrl.startsWith('https://script.google.com')) {
      window.history.replaceState(null, '', window.location.pathname);
      setSyncStatus('syncing');
      isSyncInProgress.current = true;

      pullFromGoogleSheets(detectedUrl)
        .then((res) => {
          if (res.success && res.data && res.data.trips && res.data.trips.length > 0) {
            setAppState((prev) => {
              const updatedConfig: GoogleSheetsConfig = {
                ...prev.sheetsConfig,
                webhookUrl: detectedUrl,
                autoSync: true,
                lastSyncDate: new Date().toISOString(),
                syncStatus: 'success',
              };
              return smartMergeStates({ ...prev, sheetsConfig: updatedConfig }, res.data);
            });
            setSyncStatus('success');
            showToast('¡Conectado con éxito! Se han descargado los datos de tu viaje compartido.');
          }
        })
        .catch((err) => {
          console.warn('Error syncing from share link:', err);
          setSyncStatus('error');
        })
        .finally(() => {
          isSyncInProgress.current = false;
        });
    } else {
      // If webhookUrl already configured in storage, perform an initial pull to get latest data from other travelers
      const existingUrl = appState.sheetsConfig?.webhookUrl?.trim();
      if (existingUrl && appState.sheetsConfig?.autoSync !== false && navigator.onLine && !isSyncInProgress.current) {
        setSyncStatus('syncing');
        isSyncInProgress.current = true;
        pullFromGoogleSheets(existingUrl)
          .then((res) => {
            if (res.success && res.data && res.data.trips && res.data.trips.length > 0) {
              setAppState((prev) => smartMergeStates(prev, res.data));
              setSyncStatus('success');
            } else {
              setSyncStatus('success');
            }
          })
          .catch((err) => {
            console.warn('Initial cloud pull:', err);
            setSyncStatus('idle');
          })
          .finally(() => {
            isSyncInProgress.current = false;
          });
      }
    }
  }, []);

  // 2. Background Pull when tab regains focus or visibility (so edits from other travelers appear seamlessly)
  const lastFocusPullTime = useRef<number>(Date.now());
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const webhookUrl = appStateRef.current.sheetsConfig?.webhookUrl?.trim();
        if (
          webhookUrl &&
          appStateRef.current.sheetsConfig?.autoSync !== false &&
          navigator.onLine &&
          !isSyncInProgress.current &&
          now - lastFocusPullTime.current > 15000
        ) {
          lastFocusPullTime.current = now;
          isSyncInProgress.current = true;
          pullFromGoogleSheets(webhookUrl)
            .then((res) => {
              if (res.success && res.data && res.data.trips && res.data.trips.length > 0) {
                setAppState((prev) => smartMergeStates(prev, res.data));
                setSyncStatus('success');
              }
            })
            .catch(() => {})
            .finally(() => {
              isSyncInProgress.current = false;
            });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // 3. Periodic Background Sync (every 40 seconds when online)
  useEffect(() => {
    const webhookUrl = appState.sheetsConfig?.webhookUrl?.trim();
    if (!webhookUrl || appState.sheetsConfig?.autoSync === false || !isOnline) {
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isSyncInProgress.current) {
        const currentUrl = appStateRef.current.sheetsConfig?.webhookUrl?.trim();
        if (currentUrl) {
          isSyncInProgress.current = true;
          pullFromGoogleSheets(currentUrl)
            .then((res) => {
              if (res.success && res.data && res.data.trips && res.data.trips.length > 0) {
                setAppState((prev) => smartMergeStates(prev, res.data));
              }
            })
            .catch(() => {})
            .finally(() => {
              isSyncInProgress.current = false;
            });
        }
      }
    }, 40000);

    return () => clearInterval(interval);
  }, [appState.sheetsConfig?.webhookUrl, appState.sheetsConfig?.autoSync, isOnline]);

  // 4. Live Debounced Push to Google Sheets on local state changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const webhookUrl = appState.sheetsConfig?.webhookUrl?.trim();
    const autoSyncActive = Boolean(webhookUrl && appState.sheetsConfig?.autoSync !== false);

    if (!autoSyncActive || !isOnline) {
      return;
    }

    if (pendingPushTimer.current) {
      clearTimeout(pendingPushTimer.current);
    }

    setSyncStatus('syncing');

    pendingPushTimer.current = setTimeout(async () => {
      if (isSyncInProgress.current) {
        return;
      }
      try {
        isSyncInProgress.current = true;
        const res = await pushToGoogleSheets(webhookUrl!, appStateRef.current);
        if (res.success) {
          setSyncStatus('success');
          setAppState((prev) => ({
            ...prev,
            sheetsConfig: {
              ...prev.sheetsConfig,
              lastSyncDate: new Date().toISOString(),
              syncStatus: 'success',
              errorMessage: undefined,
            },
          }));
        } else {
          setSyncStatus('error');
        }
      } catch (err: any) {
        console.warn('Auto-sync error:', err);
        setSyncStatus('error');
      } finally {
        isSyncInProgress.current = false;
      }
    }, 1200);

    return () => {
      if (pendingPushTimer.current) {
        clearTimeout(pendingPushTimer.current);
      }
    };
  }, [
    appState.trips,
    appState.participants,
    appState.categories,
    appState.expenses,
    appState.settlements,
    appState.sheetsConfig?.webhookUrl,
    appState.sheetsConfig?.autoSync,
    isOnline,
  ]);

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
    removeTombstone('expenses', savedExpense.id);
    const expenseWithTimestamp: Expense = {
      ...savedExpense,
      updatedAt: new Date().toISOString(),
      createdAt: savedExpense.createdAt || new Date().toISOString(),
    };

    setAppState((prev) => {
      const exists = prev.expenses.some((e) => e.id === expenseWithTimestamp.id);
      const updatedExpenses = exists
        ? prev.expenses.map((e) => (e.id === expenseWithTimestamp.id ? expenseWithTimestamp : e))
        : [expenseWithTimestamp, ...prev.expenses];

      return {
        ...prev,
        expenses: updatedExpenses,
      };
    });
  };

  // Handler: Delete Expense
  const handleDeleteExpense = (expenseId: string) => {
    addTombstone('expenses', expenseId);
    setAppState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
  };

  // Handler: Add Trip
  const handleAddTrip = (newTrip: Trip, initialParticipantNames: string[]) => {
    removeTombstone('trips', newTrip.id);
    const tripWithTimestamp: Trip = {
      ...newTrip,
      updatedAt: new Date().toISOString(),
      createdAt: newTrip.createdAt || new Date().toISOString(),
    };

    const newParticipants: Participant[] = initialParticipantNames.map((name, idx) => {
      const pId = `part-${Date.now()}-${idx}`;
      removeTombstone('participants', pId);
      return {
        id: pId,
        tripId: tripWithTimestamp.id,
        name: name,
        avatar: ['👨🏻', '👩🏻', '🧔🏻', '👱🏼‍♀️', '👩🏽', '👨🏻‍🦱'][idx % 6] || '👤',
        color: PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length],
        weight: 1,
        updatedAt: new Date().toISOString(),
      };
    });

    setAppState((prev) => ({
      ...prev,
      trips: [tripWithTimestamp, ...prev.trips],
      activeTripId: tripWithTimestamp.id,
      participants: [...prev.participants, ...newParticipants],
    }));

    setActiveTab('expenses');
  };

  // Handler: Update Trip
  const handleUpdateTrip = (updatedTrip: Trip) => {
    removeTombstone('trips', updatedTrip.id);
    const tripWithTimestamp: Trip = {
      ...updatedTrip,
      updatedAt: new Date().toISOString(),
    };
    setAppState((prev) => ({
      ...prev,
      trips: prev.trips.map((t) => (t.id === tripWithTimestamp.id ? tripWithTimestamp : t)),
    }));
  };

  // Handler: Delete Trip
  const handleDeleteTrip = (tripId: string) => {
    addTombstone('trips', tripId);
    setAppState((prev) => {
      const remainingTrips = prev.trips.filter((t) => t.id !== tripId);
      let nextTrips = remainingTrips;
      let nextActiveId = remainingTrips.length > 0 ? remainingTrips[0].id : null;
      let nextParticipants = prev.participants.filter((p) => p.tripId !== tripId);

      // If user deleted the last trip, provide a clean default trip so the app stays functional
      if (remainingTrips.length === 0) {
        const defaultTrip: Trip = {
          id: `trip-${Date.now()}`,
          name: 'Nuevo Viaje',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          baseCurrency: 'EUR',
          currencies: ['EUR'],
          exchangeRates: { EUR: 1.0 },
          coverEmoji: '✈️',
          coverGradient: 'from-indigo-600 to-rose-500',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const defaultParticipant: Participant = {
          id: `part-${Date.now()}`,
          tripId: defaultTrip.id,
          name: 'Yo',
          avatar: '👤',
          color: '#4F46E5',
          weight: 1,
          updatedAt: new Date().toISOString(),
        };
        nextTrips = [defaultTrip];
        nextActiveId = defaultTrip.id;
        nextParticipants = [defaultParticipant];
      }

      return {
        ...prev,
        trips: nextTrips,
        activeTripId: nextActiveId,
        participants: nextParticipants,
        expenses: prev.expenses.filter((e) => e.tripId !== tripId),
        settlements: prev.settlements.filter((s) => s.tripId !== tripId),
      };
    });
  };

  // Handler: Participants
  const handleAddParticipant = (p: Participant) => {
    removeTombstone('participants', p.id);
    const pWithTimestamp = { ...p, updatedAt: new Date().toISOString() };
    setAppState((prev) => ({
      ...prev,
      participants: [...prev.participants, pWithTimestamp],
    }));
  };

  const handleUpdateParticipant = (p: Participant) => {
    removeTombstone('participants', p.id);
    const pWithTimestamp = { ...p, updatedAt: new Date().toISOString() };
    setAppState((prev) => ({
      ...prev,
      participants: prev.participants.map((item) => (item.id === p.id ? pWithTimestamp : item)),
    }));
  };

  const handleDeleteParticipant = (pId: string) => {
    addTombstone('participants', pId);
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
    removeTombstone('categories', c.id);
    const cWithTimestamp = { ...c, updatedAt: new Date().toISOString() };
    setAppState((prev) => ({
      ...prev,
      categories: [...prev.categories, cWithTimestamp],
    }));
  };

  const handleUpdateCategory = (c: Category) => {
    removeTombstone('categories', c.id);
    const cWithTimestamp = { ...c, updatedAt: new Date().toISOString() };
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.map((item) => (item.id === c.id ? cWithTimestamp : item)),
    }));
  };

  const handleDeleteCategory = (cId: string) => {
    addTombstone('categories', cId);
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item.id !== cId),
    }));
  };

  // Handler: Settlements
  const handleAddSettlement = (s: Settlement) => {
    removeTombstone('settlements', s.id);
    const sWithTimestamp = { ...s, updatedAt: new Date().toISOString() };
    setAppState((prev) => ({
      ...prev,
      settlements: [sWithTimestamp, ...prev.settlements],
    }));
  };

  const handleDeleteSettlement = (sId: string) => {
    addTombstone('settlements', sId);
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
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] bg-indigo-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-700 animate-in slide-in-from-top-4 fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold leading-snug flex-1">{toastMessage}</p>
        </div>
      )}

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
        sheetsSyncStatus={syncStatus}
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
