import { AppState, Trip, Participant, Category, Expense, Settlement, GoogleSheetsConfig } from '../types';
import {
  INITIAL_TRIPS,
  INITIAL_PARTICIPANTS,
  DEFAULT_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_SETTLEMENTS,
  INITIAL_SHEETS_CONFIG
} from '../data/initialData';

const STORAGE_KEY = 'travel_money_app_state_v2';
const LEGACY_STORAGE_KEY = 'travel_money_app_state_v1';
const WEBHOOK_PERSISTENT_KEY = 'travel_money_webhook_url_persistent';
const AUTO_BACKUP_KEY = 'travel_money_auto_backup_snapshot';
const TOMBSTONES_KEY = 'travel_money_tombstones_v1';

export interface Tombstones {
  expenses: string[];
  trips: string[];
  participants: string[];
  categories: string[];
  settlements: string[];
}

/**
 * Loads persistent Webhook URL that survives resets and cache issues
 */
export function getPersistentWebhookUrl(): string {
  try {
    return localStorage.getItem(WEBHOOK_PERSISTENT_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Saves persistent Webhook URL
 */
export function setPersistentWebhookUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(WEBHOOK_PERSISTENT_KEY, url.trim());
    } else {
      localStorage.removeItem(WEBHOOK_PERSISTENT_KEY);
    }
  } catch (err) {
    console.error('Error saving persistent webhook URL:', err);
  }
}

/**
 * Gets deletion tombstones to prevent remote resurrection
 */
export function getTombstones(): Tombstones {
  try {
    const raw = localStorage.getItem(TOMBSTONES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        trips: Array.isArray(parsed.trips) ? parsed.trips : [],
        participants: Array.isArray(parsed.participants) ? parsed.participants : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
      };
    }
  } catch {}
  return { expenses: [], trips: [], participants: [], categories: [], settlements: [] };
}

/**
 * Adds an ID to tombstones (e.g. when an expense or trip is intentionally deleted)
 */
export function addTombstone(
  type: 'expenses' | 'trips' | 'participants' | 'categories' | 'settlements',
  id: string
): void {
  try {
    const tombstones = getTombstones();
    if (!tombstones[type].includes(id)) {
      tombstones[type].push(id);
      // Keep max 500 tombstones to avoid storage bloat
      if (tombstones[type].length > 500) {
        tombstones[type] = tombstones[type].slice(-500);
      }
      localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(tombstones));
    }
  } catch (err) {
    console.error('Error adding tombstone:', err);
  }
}

/**
 * Removes an ID from tombstones (e.g. if re-created)
 */
export function removeTombstone(
  type: 'expenses' | 'trips' | 'participants' | 'categories' | 'settlements',
  id: string
): void {
  try {
    const tombstones = getTombstones();
    tombstones[type] = tombstones[type].filter((item) => item !== id);
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(tombstones));
  } catch (err) {
    console.error('Error removing tombstone:', err);
  }
}

/**
 * Loads the complete AppState with strong integrity checks
 */
export function loadAppState(): AppState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // Migration from v1 if v2 doesn't exist
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    const persistentWebhook = getPersistentWebhookUrl();

    if (!raw) {
      const defaultState: AppState = {
        trips: INITIAL_TRIPS,
        activeTripId: INITIAL_TRIPS[0]?.id || null,
        participants: INITIAL_PARTICIPANTS,
        categories: DEFAULT_CATEGORIES,
        expenses: INITIAL_EXPENSES,
        settlements: INITIAL_SETTLEMENTS,
        sheetsConfig: {
          ...INITIAL_SHEETS_CONFIG,
          webhookUrl: persistentWebhook || INITIAL_SHEETS_CONFIG.webhookUrl,
        },
      };
      saveAppState(defaultState);
      return defaultState;
    }

    const parsed = JSON.parse(raw) as AppState;

    // Safety checks & fallbacks
    if (!parsed.trips || !Array.isArray(parsed.trips) || parsed.trips.length === 0) {
      parsed.trips = INITIAL_TRIPS;
    }

    if (!parsed.activeTripId && parsed.trips.length > 0) {
      parsed.activeTripId = parsed.trips[0].id;
    }

    if (!parsed.participants || !Array.isArray(parsed.participants)) {
      parsed.participants = INITIAL_PARTICIPANTS;
    }

    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      parsed.categories = DEFAULT_CATEGORIES;
    }

    if (!parsed.expenses || !Array.isArray(parsed.expenses)) {
      parsed.expenses = [];
    }

    if (!parsed.settlements || !Array.isArray(parsed.settlements)) {
      parsed.settlements = [];
    }

    if (!parsed.sheetsConfig) {
      parsed.sheetsConfig = {
        ...INITIAL_SHEETS_CONFIG,
        webhookUrl: persistentWebhook || '',
      };
    } else if (persistentWebhook && !parsed.sheetsConfig.webhookUrl) {
      // Restore webhook if it was lost in config
      parsed.sheetsConfig.webhookUrl = persistentWebhook;
    }

    return parsed;
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    const persistentWebhook = getPersistentWebhookUrl();
    return {
      trips: INITIAL_TRIPS,
      activeTripId: INITIAL_TRIPS[0]?.id || null,
      participants: INITIAL_PARTICIPANTS,
      categories: DEFAULT_CATEGORIES,
      expenses: INITIAL_EXPENSES,
      settlements: INITIAL_SETTLEMENTS,
      sheetsConfig: {
        ...INITIAL_SHEETS_CONFIG,
        webhookUrl: persistentWebhook || '',
      },
    };
  }
}

/**
 * Saves AppState to localStorage safely with backup snapshot
 */
export function saveAppState(state: AppState): void {
  try {
    // Keep persistent webhook URL in sync
    if (state.sheetsConfig?.webhookUrl) {
      setPersistentWebhookUrl(state.sheetsConfig.webhookUrl);
    }

    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);

    // If state contains real expenses/trips, take an automatic rolling safety snapshot
    if (state.expenses && state.expenses.length > 0) {
      localStorage.setItem(AUTO_BACKUP_KEY, serialized);
    }
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

/**
 * Restores the latest automatic safety backup snapshot
 */
export function restoreAutoBackup(): AppState | null {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.trips && parsed.trips.length > 0) {
        saveAppState(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error restoring auto backup:', err);
  }
  return null;
}

/**
 * Resets to demo data while PRESERVING configured Google Sheets Webhook URL
 */
export function resetToDemoData(): AppState {
  const persistentWebhook = getPersistentWebhookUrl();
  const state: AppState = {
    trips: INITIAL_TRIPS,
    activeTripId: INITIAL_TRIPS[0].id,
    participants: INITIAL_PARTICIPANTS,
    categories: DEFAULT_CATEGORIES,
    expenses: INITIAL_EXPENSES,
    settlements: INITIAL_SETTLEMENTS,
    sheetsConfig: {
      ...INITIAL_SHEETS_CONFIG,
      webhookUrl: persistentWebhook || '',
      autoSync: true,
    },
  };
  saveAppState(state);
  return state;
}

export function exportBackupJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importBackupJSON(jsonStr: string): AppState {
  const parsed = JSON.parse(jsonStr) as AppState;
  if (!parsed.trips || !Array.isArray(parsed.trips)) {
    throw new Error('Archivo de copia de seguridad no válido (faltan viajes).');
  }
  saveAppState(parsed);
  return parsed;
}

