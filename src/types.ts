export type PaymentType = 'cash' | 'card'; // 'efectivo' | 'tarjeta'

export type SplitType = 'equal' | 'custom_amounts' | 'shares';

export interface ParticipantSplit {
  participantId: string;
  amount: number; // in expense currency
  amountInBase: number; // in trip base currency
  share?: number; // e.g. 1, 2, 0.5
  isIncluded?: boolean;
}

export interface Participant {
  id: string;
  tripId: string;
  name: string;
  avatar: string; // Emoji or initials
  color: string; // Hex or Tailwind color class
  weight?: number; // Default 1
  email?: string;
  phone?: string;
}

export interface Category {
  id: string;
  tripId?: string; // Optional: if undefined, is global
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex or color name
  description?: string;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number; // amount in original currency
  currency: string; // e.g. 'EUR', 'USD', 'JPY'
  exchangeRate: number; // rate to base currency: 1 [currency] = exchangeRate [baseCurrency]
  amountInBaseCurrency: number; // amount * exchangeRate
  paidById: string; // Participant ID
  paymentType: PaymentType; // 'cash' | 'card'
  categoryId: string; // Category ID
  locationName?: string; // e.g. "Trattoria Da Luigi"
  locality?: string; // e.g. "Roma", "Tokyo", "Madrid"
  date: string; // YYYY-MM-DD or ISO string
  notes?: string;
  splitType: SplitType;
  splits: ParticipantSplit[];
  createdAt: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  tripId: string;
  fromParticipantId: string; // who pays
  toParticipantId: string; // who receives
  amount: number; // in base currency
  currency: string;
  date: string;
  status: 'pending' | 'completed';
  notes?: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRateToBase?: number; // approx relative to EUR or USD
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  baseCurrency: string; // e.g. 'EUR'
  currencies: string[]; // List of currencies used in this trip, e.g. ['EUR', 'JPY', 'USD']
  exchangeRates: Record<string, number>; // e.g. { 'JPY': 0.0062, 'USD': 0.92, 'EUR': 1 }
  coverEmoji: string;
  coverGradient: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DebtTransfer {
  fromId: string;
  fromName: string;
  fromAvatar: string;
  fromColor: string;
  toId: string;
  toName: string;
  toAvatar: string;
  toColor: string;
  amount: number;
  currency: string;
}

export interface ParticipantBalance {
  participant: Participant;
  totalPaid: number; // in base currency
  totalOwed: number; // in base currency (what they should pay for what they consumed)
  netBalance: number; // totalPaid - totalOwed. Positive = to receive, Negative = to pay
}

export interface GoogleSheetsConfig {
  sheetUrl?: string;
  webhookUrl?: string; // Google Apps Script Web App URL
  autoSync: boolean;
  lastSyncDate?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface AppState {
  trips: Trip[];
  activeTripId: string | null;
  participants: Participant[];
  categories: Category[];
  expenses: Expense[];
  settlements: Settlement[];
  sheetsConfig: GoogleSheetsConfig;
}
