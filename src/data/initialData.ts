import { Category, CurrencyInfo, Trip, Participant, Expense, Settlement, GoogleSheetsConfig } from '../types';

export const POPULAR_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', defaultRateToBase: 1.0 },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', flag: '🇺🇸', defaultRateToBase: 0.92 },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', flag: '🇬🇧', defaultRateToBase: 1.17 },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥', flag: '🇯🇵', defaultRateToBase: 0.0062 },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF', flag: '🇨🇭', defaultRateToBase: 1.05 },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', flag: '🇲🇽', defaultRateToBase: 0.051 },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', flag: '🇦🇷', defaultRateToBase: 0.00095 },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', flag: '🇨🇴', defaultRateToBase: 0.00023 },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', flag: '🇨🇱', defaultRateToBase: 0.00098 },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/', flag: '🇵🇪', defaultRateToBase: 0.25 },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', flag: '🇧🇷', defaultRateToBase: 0.16 },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$', flag: '🇨🇦', defaultRateToBase: 0.67 },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$', flag: '🇦🇺', defaultRateToBase: 0.60 },
  { code: 'THB', name: 'Baht tailandés', symbol: '฿', flag: '🇹🇭', defaultRateToBase: 0.026 },
  { code: 'MAD', name: 'Dírham marroquí', symbol: 'DH', flag: '🇲🇦', defaultRateToBase: 0.093 },
  { code: 'TRY', name: 'Lira turca', symbol: '₺', flag: '🇹🇷', defaultRateToBase: 0.027 },
  { code: 'IDR', name: 'Rupia indonesia', symbol: 'Rp', flag: '🇮🇩', defaultRateToBase: 0.000058 },
  { code: 'CZK', name: 'Corona checa', symbol: 'Kč', flag: '🇨🇿', defaultRateToBase: 0.040 },
  { code: 'HUF', name: 'Florín húngaro', symbol: 'Ft', flag: '🇭🇺', defaultRateToBase: 0.0025 },
  { code: 'SEK', name: 'Corona sueca', symbol: 'kr', flag: '🇸🇪', defaultRateToBase: 0.088 },
  { code: 'NOK', name: 'Corona noruega', symbol: 'kr', flag: '🇳🇴', defaultRateToBase: 0.086 },
  { code: 'DKK', name: 'Corona danesa', symbol: 'kr', flag: '🇩🇰', defaultRateToBase: 0.13 },
  { code: 'PLN', name: 'Zloty polaco', symbol: 'zł', flag: '🇵🇱', defaultRateToBase: 0.23 },
  { code: 'EGP', name: 'Libra egipcia', symbol: 'E£', flag: '🇪🇬', defaultRateToBase: 0.019 },
  { code: 'AED', name: 'Dírham de EAU', symbol: 'AED', flag: '🇦🇪', defaultRateToBase: 0.25 },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Restaurantes & Bares', icon: 'Utensils', color: '#FF6B6B', description: 'Comidas, cenas, tapas y copas' },
  { id: 'cat-stay', name: 'Alojamiento', icon: 'Hotel', color: '#4D96FF', description: 'Hoteles, Airbnb, hostales' },
  { id: 'cat-transport', name: 'Transporte & Vuelos', icon: 'Plane', color: '#6BCB77', description: 'Billetes, trenes, metro, taxis' },
  { id: 'cat-fuel', name: 'Combustible & Peajes', icon: 'Fuel', color: '#FFD93D', description: 'Gasolina, párkings, autopistas' },
  { id: 'cat-market', name: 'Supermercado', icon: 'ShoppingCart', color: '#9B51E0', description: 'Compras de comida y provisiones' },
  { id: 'cat-leisure', name: 'Ocio & Entradas', icon: 'Ticket', color: '#FF76CE', description: 'Museos, tours, actividades, parques' },
  { id: 'cat-shopping', name: 'Compras & Souvenirs', icon: 'ShoppingBag', color: '#38E54D', description: 'Recuerdos, ropa, regalos' },
  { id: 'cat-general', name: 'Otros gastos', icon: 'Coins', color: '#A0AEC0', description: 'Gastos varios o imprevistos' },
];

export const VIBRANT_GRADIENTS = [
  'from-rose-500 via-pink-500 to-amber-400',
  'from-indigo-600 via-purple-600 to-pink-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-blue-600 via-cyan-500 to-teal-400',
  'from-amber-500 via-orange-500 to-red-500',
  'from-fuchsia-600 via-pink-600 to-rose-400',
  'from-violet-600 via-indigo-600 to-blue-500',
];

export const PARTICIPANT_COLORS = [
  '#FF6B6B', // Coral Red
  '#4D96FF', // Ocean Blue
  '#6BCB77', // Mint Green
  '#FFD93D', // Bright Yellow
  '#9B51E0', // Deep Purple
  '#FF76CE', // Neon Pink
  '#20B2AA', // Light Sea Green
  '#FF9F43', // Warm Amber
  '#00D2D3', // Bright Cyan
  '#54A0FF', // Sky Blue
  '#5f27cd', // Imperial Purple
  '#10ac84', // Dark Mountain Meadow
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-japan-2026',
    name: 'Aventura en Japón 🏯',
    description: 'Ruta Tokio - Kioto - Osaka con amigos',
    startDate: '2026-04-10',
    endDate: '2026-04-24',
    baseCurrency: 'EUR',
    currencies: ['EUR', 'JPY', 'USD'],
    exchangeRates: {
      EUR: 1.0,
      JPY: 0.0061, // 1000 JPY = 6.10 EUR
      USD: 0.92,
    },
    coverEmoji: '⛩️',
    coverGradient: 'from-rose-500 via-pink-500 to-amber-400',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'trip-roma-2026',
    name: 'Escapada a Roma 🍕',
    description: 'Fin de semana gastronómico e histórico',
    startDate: '2026-05-15',
    endDate: '2026-05-18',
    baseCurrency: 'EUR',
    currencies: ['EUR'],
    exchangeRates: {
      EUR: 1.0,
    },
    coverEmoji: '🛵',
    coverGradient: 'from-amber-500 via-orange-500 to-red-500',
    createdAt: '2026-03-10T12:00:00Z',
  },
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  // Japan Trip
  { id: 'part-1', tripId: 'trip-japan-2026', name: 'Laura', avatar: '👩🏻‍🦰', color: '#FF6B6B', weight: 1 },
  { id: 'part-2', tripId: 'trip-japan-2026', name: 'Carlos', avatar: '🧔🏻', color: '#4D96FF', weight: 1 },
  { id: 'part-3', tripId: 'trip-japan-2026', name: 'Sofía', avatar: '👩🏽', color: '#6BCB77', weight: 1 },
  { id: 'part-4', tripId: 'trip-japan-2026', name: 'Marcos', avatar: '👨🏻‍🦱', color: '#FFD93D', weight: 1 },

  // Roma Trip
  { id: 'part-5', tripId: 'trip-roma-2026', name: 'Laura', avatar: '👩🏻‍🦰', color: '#FF6B6B', weight: 1 },
  { id: 'part-6', tripId: 'trip-roma-2026', name: 'Carlos', avatar: '🧔🏻', color: '#4D96FF', weight: 1 },
  { id: 'part-7', tripId: 'trip-roma-2026', name: 'Elena', avatar: '👱🏼‍♀️', color: '#9B51E0', weight: 1 },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    tripId: 'trip-japan-2026',
    title: 'Cena Ramen en Shinjuku',
    amount: 9800,
    currency: 'JPY',
    exchangeRate: 0.0061,
    amountInBaseCurrency: 59.78,
    paidById: 'part-1', // Laura
    paymentType: 'card',
    categoryId: 'cat-food',
    locationName: 'Ichiran Ramen',
    locality: 'Tokio',
    date: '2026-04-11',
    notes: 'Ramen especial con huevo y gyozas para los 4',
    splitType: 'equal',
    splits: [
      { participantId: 'part-1', amount: 2450, amountInBase: 14.945, isIncluded: true },
      { participantId: 'part-2', amount: 2450, amountInBase: 14.945, isIncluded: true },
      { participantId: 'part-3', amount: 2450, amountInBase: 14.945, isIncluded: true },
      { participantId: 'part-4', amount: 2450, amountInBase: 14.945, isIncluded: true },
    ],
    createdAt: '2026-04-11T20:30:00Z',
  },
  {
    id: 'exp-2',
    tripId: 'trip-japan-2026',
    title: 'Billetes Tren Bala Shinkansen (Tokio -> Kioto)',
    amount: 56000,
    currency: 'JPY',
    exchangeRate: 0.0061,
    amountInBaseCurrency: 341.60,
    paidById: 'part-2', // Carlos
    paymentType: 'card',
    categoryId: 'cat-transport',
    locationName: 'Tokyo Station JR Central',
    locality: 'Tokio',
    date: '2026-04-14',
    notes: '4 billetes con asiento reservado',
    splitType: 'equal',
    splits: [
      { participantId: 'part-1', amount: 14000, amountInBase: 85.40, isIncluded: true },
      { participantId: 'part-2', amount: 14000, amountInBase: 85.40, isIncluded: true },
      { participantId: 'part-3', amount: 14000, amountInBase: 85.40, isIncluded: true },
      { participantId: 'part-4', amount: 14000, amountInBase: 85.40, isIncluded: true },
    ],
    createdAt: '2026-04-14T09:15:00Z',
  },
  {
    id: 'exp-3',
    tripId: 'trip-japan-2026',
    title: 'Supermercado 7-Eleven desayuno y snacks',
    amount: 4200,
    currency: 'JPY',
    exchangeRate: 0.0061,
    amountInBaseCurrency: 25.62,
    paidById: 'part-3', // Sofía
    paymentType: 'cash',
    categoryId: 'cat-market',
    locationName: '7-Eleven Gion',
    locality: 'Kioto',
    date: '2026-04-15',
    notes: 'Onigiris, café y matcha para excursión',
    splitType: 'equal',
    splits: [
      { participantId: 'part-1', amount: 1050, amountInBase: 6.405, isIncluded: true },
      { participantId: 'part-2', amount: 1050, amountInBase: 6.405, isIncluded: true },
      { participantId: 'part-3', amount: 1050, amountInBase: 6.405, isIncluded: true },
      { participantId: 'part-4', amount: 1050, amountInBase: 6.405, isIncluded: true },
    ],
    createdAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'exp-4',
    tripId: 'trip-japan-2026',
    title: 'Entradas Bosque de Bambú y Templos',
    amount: 3200,
    currency: 'JPY',
    exchangeRate: 0.0061,
    amountInBaseCurrency: 19.52,
    paidById: 'part-4', // Marcos
    paymentType: 'cash',
    categoryId: 'cat-leisure',
    locationName: 'Tenryu-ji & Arashiyama',
    locality: 'Kioto',
    date: '2026-04-16',
    notes: 'Entrada a jardines zen',
    splitType: 'equal',
    splits: [
      { participantId: 'part-1', amount: 800, amountInBase: 4.88, isIncluded: true },
      { participantId: 'part-2', amount: 800, amountInBase: 4.88, isIncluded: true },
      { participantId: 'part-3', amount: 800, amountInBase: 4.88, isIncluded: true },
      { participantId: 'part-4', amount: 800, amountInBase: 4.88, isIncluded: true },
    ],
    createdAt: '2026-04-16T11:45:00Z',
  },
  {
    id: 'exp-5',
    tripId: 'trip-japan-2026',
    title: 'Alojamiento Ryokan tradicional con aguas termales',
    amount: 480.00,
    currency: 'EUR',
    exchangeRate: 1.0,
    amountInBaseCurrency: 480.00,
    paidById: 'part-1', // Laura
    paymentType: 'card',
    categoryId: 'cat-stay',
    locationName: 'Ryokan Momijiya',
    locality: 'Takao',
    date: '2026-04-17',
    notes: 'Reserva prepagada en euros',
    splitType: 'equal',
    splits: [
      { participantId: 'part-1', amount: 120, amountInBase: 120, isIncluded: true },
      { participantId: 'part-2', amount: 120, amountInBase: 120, isIncluded: true },
      { participantId: 'part-3', amount: 120, amountInBase: 120, isIncluded: true },
      { participantId: 'part-4', amount: 120, amountInBase: 120, isIncluded: true },
    ],
    createdAt: '2026-04-17T18:00:00Z',
  },
  {
    id: 'exp-6',
    tripId: 'trip-japan-2026',
    title: 'Cena Street Food en Dotonbori',
    amount: 12500,
    currency: 'JPY',
    exchangeRate: 0.0061,
    amountInBaseCurrency: 76.25,
    paidById: 'part-4', // Marcos
    paymentType: 'cash',
    categoryId: 'cat-food',
    locationName: 'Dotonbori Canal',
    locality: 'Osaka',
    date: '2026-04-19',
    notes: 'Takoyaki, okonomiyaki y cervezas',
    splitType: 'equal',
    splits: [
      { participantId: 'part-1', amount: 3125, amountInBase: 19.0625, isIncluded: true },
      { participantId: 'part-2', amount: 3125, amountInBase: 19.0625, isIncluded: true },
      { participantId: 'part-3', amount: 3125, amountInBase: 19.0625, isIncluded: true },
      { participantId: 'part-4', amount: 3125, amountInBase: 19.0625, isIncluded: true },
    ],
    createdAt: '2026-04-19T21:00:00Z',
  }
];

export const INITIAL_SETTLEMENTS: Settlement[] = [];

export const INITIAL_SHEETS_CONFIG: GoogleSheetsConfig = {
  sheetUrl: '',
  webhookUrl: '',
  autoSync: false,
  syncStatus: 'idle',
};
