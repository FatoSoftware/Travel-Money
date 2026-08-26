import { Trip, Participant, Expense, Settlement, ParticipantBalance, DebtTransfer, Category, PaymentType } from '../types';
import { POPULAR_CURRENCIES } from '../data/initialData';

export function getCurrencySymbol(code: string): string {
  const found = POPULAR_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found ? found.symbol : code;
}

export function formatMoney(amount: number, currencyCode: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function calculateTripSummary(
  trip: Trip,
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[]
) {
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
  const tripParticipants = participants.filter((p) => p.tripId === trip.id);
  const tripSettlements = settlements.filter((s) => s.tripId === trip.id && s.status === 'completed');

  // Total spent in base currency
  const totalSpentBase = tripExpenses.reduce((acc, e) => acc + (e.amountInBaseCurrency || 0), 0);

  // Totals by currency
  const spentByCurrency: Record<string, number> = {};
  tripExpenses.forEach((e) => {
    spentByCurrency[e.currency] = (spentByCurrency[e.currency] || 0) + e.amount;
  });

  // Calculate balances per participant
  const balances: Record<string, { paid: number; owed: number }> = {};
  tripParticipants.forEach((p) => {
    balances[p.id] = { paid: 0, owed: 0 };
  });

  // Add expenses
  tripExpenses.forEach((e) => {
    // What the payer paid
    if (balances[e.paidById]) {
      balances[e.paidById].paid += e.amountInBaseCurrency;
    }

    // What each split owes
    if (e.splits && e.splits.length > 0) {
      e.splits.forEach((split) => {
        if (split.isIncluded !== false && balances[split.participantId]) {
          balances[split.participantId].owed += split.amountInBase || (split.amount * (e.exchangeRate || 1));
        }
      });
    } else {
      // Fallback equal split
      const equalShare = e.amountInBaseCurrency / (tripParticipants.length || 1);
      tripParticipants.forEach((p) => {
        if (balances[p.id]) balances[p.id].owed += equalShare;
      });
    }
  });

  // Adjust for completed settlements (reimbursements)
  tripSettlements.forEach((s) => {
    if (balances[s.fromParticipantId]) {
      balances[s.fromParticipantId].paid += s.amount;
    }
    if (balances[s.toParticipantId]) {
      balances[s.toParticipantId].owed += s.amount;
    }
  });

  const participantBalances: ParticipantBalance[] = tripParticipants.map((p) => {
    const stat = balances[p.id] || { paid: 0, owed: 0 };
    return {
      participant: p,
      totalPaid: stat.paid,
      totalOwed: stat.owed,
      netBalance: Number((stat.paid - stat.owed).toFixed(2)),
    };
  });

  return {
    totalSpentBase,
    spentByCurrency,
    participantBalances,
    expensesCount: tripExpenses.length,
    participantsCount: tripParticipants.length,
  };
}

/**
 * Calculates optimal minimal debt settlements among participants (Greedy Minimum Cash Flow algorithm)
 */
export function calculateOptimalDebts(
  trip: Trip,
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[]
): DebtTransfer[] {
  const { participantBalances } = calculateTripSummary(trip, participants, expenses, settlements);

  // Debtors have negative netBalance (they owe money)
  // Creditors have positive netBalance (they should receive money)
  const debtors: { participant: Participant; amount: number }[] = [];
  const creditors: { participant: Participant; amount: number }[] = [];

  participantBalances.forEach((pb) => {
    const net = pb.netBalance;
    if (net < -0.01) {
      debtors.push({ participant: pb.participant, amount: -net });
    } else if (net > 0.01) {
      creditors.push({ participant: pb.participant, amount: net });
    }
  });

  // Sort descending by amount for faster and cleaner resolution
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: DebtTransfer[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferAmount = Math.min(debtor.amount, creditor.amount);
    if (transferAmount > 0.01) {
      transfers.push({
        fromId: debtor.participant.id,
        fromName: debtor.participant.name,
        fromAvatar: debtor.participant.avatar,
        fromColor: debtor.participant.color,
        toId: creditor.participant.id,
        toName: creditor.participant.name,
        toAvatar: creditor.participant.avatar,
        toColor: creditor.participant.color,
        amount: Number(transferAmount.toFixed(2)),
        currency: trip.baseCurrency,
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return transfers;
}

export function calculateCategoryBreakdown(
  trip: Trip,
  categories: Category[],
  expenses: Expense[]
) {
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
  const total = tripExpenses.reduce((sum, e) => sum + e.amountInBaseCurrency, 0);

  const categoryMap: Record<string, { category: Category; total: number; count: number }> = {};

  categories.forEach((cat) => {
    categoryMap[cat.id] = { category: cat, total: 0, count: 0 };
  });

  // Add fallback 'otros' if missing
  const fallbackCategory: Category = {
    id: 'cat-general',
    name: 'Otros',
    icon: 'Coins',
    color: '#94A3B8',
  };

  tripExpenses.forEach((e) => {
    const cat = categoryMap[e.categoryId]?.category || fallbackCategory;
    if (!categoryMap[e.categoryId]) {
      categoryMap[e.categoryId] = { category: cat, total: 0, count: 0 };
    }
    categoryMap[e.categoryId].total += e.amountInBaseCurrency;
    categoryMap[e.categoryId].count += 1;
  });

  return Object.values(categoryMap)
    .filter((item) => item.total > 0)
    .map((item) => ({
      category: item.category,
      total: Number(item.total.toFixed(2)),
      count: item.count,
      percentage: total > 0 ? Number(((item.total / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calculatePaymentTypeBreakdown(trip: Trip, expenses: Expense[]) {
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
  const total = tripExpenses.reduce((sum, e) => sum + e.amountInBaseCurrency, 0);

  let cashTotal = 0;
  let cashCount = 0;
  let cardTotal = 0;
  let cardCount = 0;

  tripExpenses.forEach((e) => {
    if (e.paymentType === 'cash') {
      cashTotal += e.amountInBaseCurrency;
      cashCount += 1;
    } else {
      cardTotal += e.amountInBaseCurrency;
      cardCount += 1;
    }
  });

  return {
    cash: {
      total: Number(cashTotal.toFixed(2)),
      count: cashCount,
      percentage: total > 0 ? Number(((cashTotal / total) * 100).toFixed(1)) : 0,
    },
    card: {
      total: Number(cardTotal.toFixed(2)),
      count: cardCount,
      percentage: total > 0 ? Number(((cardTotal / total) * 100).toFixed(1)) : 0,
    },
    total: Number(total.toFixed(2)),
  };
}

export function calculateLocalityBreakdown(trip: Trip, expenses: Expense[]) {
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
  const map: Record<string, { locality: string; total: number; count: number }> = {};
  const total = tripExpenses.reduce((sum, e) => sum + e.amountInBaseCurrency, 0);

  tripExpenses.forEach((e) => {
    const loc = e.locality?.trim() || 'Sin localidad especificada';
    if (!map[loc]) {
      map[loc] = { locality: loc, total: 0, count: 0 };
    }
    map[loc].total += e.amountInBaseCurrency;
    map[loc].count += 1;
  });

  return Object.values(map)
    .map((item) => ({
      locality: item.locality,
      total: Number(item.total.toFixed(2)),
      count: item.count,
      percentage: total > 0 ? Number(((item.total / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function generateWhatsAppSettlementSummary(
  trip: Trip,
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[]
): string {
  const { totalSpentBase, participantBalances } = calculateTripSummary(trip, participants, expenses, settlements);
  const debts = calculateOptimalDebts(trip, participants, expenses, settlements);

  let text = `✈️ *LIQUIDACIÓN DE GASTOS: ${trip.name.toUpperCase()}*\n`;
  text += `📅 ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
  text += `💰 *Gasto total del grupo:* ${formatMoney(totalSpentBase, trip.baseCurrency)}\n\n`;

  text += `📊 *BALANCE POR PERSONA:*\n`;
  participantBalances.forEach((pb) => {
    const net = pb.netBalance;
    const sign = net > 0 ? '🟢 Le deben' : net < 0 ? '🔴 Debe' : '⚪ En paz';
    const amountStr = formatMoney(Math.abs(net), trip.baseCurrency);
    text += `• ${pb.participant.name}: Pagó ${formatMoney(pb.totalPaid, trip.baseCurrency)} | Consumo ${formatMoney(pb.totalOwed, trip.baseCurrency)} -> ${sign} ${amountStr}\n`;
  });

  text += `\n🤝 *PAGOS SUGERIDOS PARA LIQUIDAR:*\n`;
  if (debts.length === 0) {
    text += `🎉 ¡Todo el mundo está al día! No hay deudas pendientes.\n`;
  } else {
    debts.forEach((d, idx) => {
      text += `${idx + 1}. *${d.fromName}* debe pagar a *${d.toName}*: ${formatMoney(d.amount, d.currency)}\n`;
    });
  }

  text += `\n_Generado con Travel Money App_ 🌍📱`;
  return text;
}
