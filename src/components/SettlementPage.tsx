import React, { useState } from 'react';
import { Trip, Participant, Expense, Settlement, DebtTransfer } from '../types';
import {
  calculateTripSummary,
  calculateOptimalDebts,
  formatMoney,
  generateWhatsAppSettlementSummary,
  formatDate,
} from '../utils/calculations';
import confetti from 'canvas-confetti';
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Sparkles,
  History,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';

interface SettlementPageProps {
  trip: Trip;
  participants: Participant[];
  expenses: Expense[];
  settlements: Settlement[];
  onAddSettlement: (settlement: Settlement) => void;
  onDeleteSettlement: (settlementId: string) => void;
}

export const SettlementPage: React.FC<SettlementPageProps> = ({
  trip,
  participants,
  expenses,
  settlements,
  onAddSettlement,
  onDeleteSettlement,
}) => {
  const [copied, setCopied] = useState(false);
  const summary = calculateTripSummary(trip, participants, expenses, settlements);
  const debts = calculateOptimalDebts(trip, participants, expenses, settlements);

  const completedSettlements = settlements.filter(
    (s) => s.tripId === trip.id && s.status === 'completed'
  );

  const handleSettleTransfer = (transfer: DebtTransfer) => {
    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      tripId: trip.id,
      fromParticipantId: transfer.fromId,
      toParticipantId: transfer.toId,
      amount: transfer.amount,
      currency: transfer.currency,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: `Liquidación directa entre ${transfer.fromName} y ${transfer.toName}`,
    };

    onAddSettlement(newSettlement);
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppSettlementSummary(trip, participants, expenses, settlements);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppSettlementSummary(trip, participants, expenses, settlements);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const partMap = new Map<string, Participant>(participants.map((p) => [p.id, p]));

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner Action Buttons */}
      <div className="bg-white border border-indigo-100 rounded-[2rem] p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
            ⚖️
          </div>
          <div>
            <h3 className="font-extrabold text-base text-indigo-950">Liquidación de Saldos</h3>
            <p className="text-xs text-slate-500">
              Algoritmo inteligente de transferencias mínimas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Share via WhatsApp */}
          <button
            id="share-whatsapp-btn"
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Copy Summary Text */}
          <button
            id="copy-summary-btn"
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* 1. SECCIÓN: QUIÉN DEBE A QUIÉN (OPTIMAL SETTLEMENTS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-sm text-indigo-950 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Pagos Sugeridos para Liquidar ({debts.length})
          </h3>
          {debts.length === 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ¡Cuentas al día! 🎉
            </span>
          )}
        </div>

        {debts.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 border border-indigo-100 shadow-sm text-center space-y-2">
            <div className="text-4xl">🤝</div>
            <h4 className="font-extrabold text-base text-indigo-950">¡No hay deudas pendientes!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Todos los participantes están al día o las transferencias ya han sido completadas.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {debts.map((transfer, idx) => (
              <div
                key={`${transfer.fromId}-${transfer.toId}-${idx}`}
                className="bg-white border border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 shadow-xs transition-all flex flex-col sm:flex-row items-center justify-between gap-3.5"
              >
                {/* Visual Flow from Debtor to Creditor */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  {/* From Person */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{transfer.fromAvatar || '👤'}</span>
                    <div>
                      <span className="font-black text-sm text-slate-900 block">{transfer.fromName}</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        Debe pagar
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 mx-1" />

                  {/* To Person */}
                  <div className="flex items-center gap-2 text-right sm:text-left">
                    <div>
                      <span className="font-black text-sm text-slate-900 block">{transfer.toName}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Recibe
                      </span>
                    </div>
                    <span className="text-2xl">{transfer.toAvatar || '👤'}</span>
                  </div>
                </div>

                {/* Amount & Mark As Settle Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-lg sm:text-xl font-black text-slate-900 block tracking-tight">
                      {formatMoney(transfer.amount, transfer.currency)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSettleTransfer(transfer)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar Pagado</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SECCIÓN: RESUMEN DE SALDOS INDIVIDUALES */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="font-black text-sm text-indigo-950 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            Balance Detallado por Participante
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {summary.participantBalances.map((pb) => {
            const isPositive = pb.netBalance > 0.01;
            const isNegative = pb.netBalance < -0.01;
            const isZero = !isPositive && !isNegative;

            return (
              <div
                key={pb.participant.id}
                className="bg-white border border-indigo-100/80 rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{pb.participant.avatar || '👤'}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{pb.participant.name}</h4>
                      <span className="text-[11px] text-slate-400">
                        {isPositive ? 'A cobrar' : isNegative ? 'A pagar' : 'Equilibrado'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        isPositive
                          ? 'text-emerald-600'
                          : isNegative
                          ? 'text-rose-500'
                          : 'text-slate-600'
                      }`}
                    >
                      {isPositive ? `+${formatMoney(pb.netBalance, trip.baseCurrency)}` : formatMoney(pb.netBalance, trip.baseCurrency)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Pagado:</span>
                    <span className="font-bold text-slate-800">
                      {formatMoney(pb.totalPaid, trip.baseCurrency)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Consumido:</span>
                    <span className="font-bold text-slate-800">
                      {formatMoney(pb.totalOwed, trip.baseCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. HISTORIAL DE PAGOS / LIQUIDACIONES COMPLETADAS */}
      {completedSettlements.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-sm text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              Historial de Pagos Realizados ({completedSettlements.length})
            </h3>
          </div>

          <div className="space-y-2">
            {completedSettlements.map((set) => {
              const fromP = partMap.get(set.fromParticipantId);
              const toP = partMap.get(set.toParticipantId);

              return (
                <div
                  key={set.id}
                  className="bg-white border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between gap-2 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-slate-900">{fromP?.name || 'Alguien'}</strong> pagó a{' '}
                      <strong className="text-slate-900">{toP?.name || 'Alguien'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-700">
                      {formatMoney(set.amount, set.currency)}
                    </span>
                    <button
                      onClick={() => onDeleteSettlement(set.id)}
                      title="Deshacer pago"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
