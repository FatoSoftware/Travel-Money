import React from 'react';
import {
  Receipt,
  Plus,
  PieChart,
  Scale,
  Users,
  Layers,
  Menu,
} from 'lucide-react';

export type NavTab = 'expenses' | 'stats' | 'settlement' | 'participants' | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  expensesCount: number;
  pendingDebtsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddExpense,
  expensesCount,
  pendingDebtsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-indigo-100 shadow-[0_-4px_25px_rgba(79,70,229,0.06)] pb-safe">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between relative">
        {/* 1. Gastos (Historial) */}
        <button
          id="nav-expenses-tab"
          onClick={() => onSelectTab('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 ${
            activeTab === 'expenses'
              ? 'text-indigo-600 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Receipt className="w-5 h-5" />
            {expensesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                {expensesCount > 99 ? '99+' : expensesCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 font-medium">Gastos</span>
          {activeTab === 'expenses' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5"></span>
          )}
        </button>

        {/* 2. Estadísticas y Clasificación */}
        <button
          id="nav-stats-tab"
          onClick={() => onSelectTab('stats')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 ${
            activeTab === 'stats'
              ? 'text-indigo-600 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[11px] mt-1 font-medium">Gráficos</span>
          {activeTab === 'stats' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5"></span>
          )}
        </button>

        {/* Center: AÑADIR GASTO (Prominent button) */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            id="nav-add-expense-btn"
            onClick={onOpenAddExpense}
            className="w-14 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-200 active:scale-95 transition-all transform hover:-translate-y-0.5 border-4 border-white"
            title="Añadir nuevo gasto"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
          <span className="text-[10px] font-bold text-slate-700 mt-0.5 tracking-tight">
            + Gasto
          </span>
        </div>

        {/* 3. Saldos y Liquidación */}
        <button
          id="nav-settlement-tab"
          onClick={() => onSelectTab('settlement')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 ${
            activeTab === 'settlement'
              ? 'text-indigo-600 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Scale className="w-5 h-5" />
            {pendingDebtsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                {pendingDebtsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 font-medium">Saldos</span>
          {activeTab === 'settlement' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5"></span>
          )}
        </button>

        {/* 4. Más / Gestión (Participantes, Categorías, Config) */}
        <button
          id="nav-more-tab"
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 ${
            activeTab === 'more'
              ? 'text-indigo-600 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-1 font-medium">Ajustes</span>
          {activeTab === 'more' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5"></span>
          )}
        </button>
      </div>
    </nav>
  );
};
