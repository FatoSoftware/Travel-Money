import { AppState, Trip, Participant, Category, Expense, Settlement, GoogleSheetsConfig } from '../types';
import {
  INITIAL_TRIPS,
  INITIAL_PARTICIPANTS,
  DEFAULT_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_SETTLEMENTS,
  INITIAL_SHEETS_CONFIG
} from '../data/initialData';

const STORAGE_KEY = 'travel_money_app_state_v1';

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState: AppState = {
        trips: INITIAL_TRIPS,
        activeTripId: INITIAL_TRIPS[0]?.id || null,
        participants: INITIAL_PARTICIPANTS,
        categories: DEFAULT_CATEGORIES,
        expenses: INITIAL_EXPENSES,
        settlements: INITIAL_SETTLEMENTS,
        sheetsConfig: INITIAL_SHEETS_CONFIG,
      };
      saveAppState(defaultState);
      return defaultState;
    }
    const parsed = JSON.parse(raw) as AppState;
    // ensure fallback fields
    if (!parsed.trips || parsed.trips.length === 0) {
      parsed.trips = INITIAL_TRIPS;
    }
    if (!parsed.activeTripId && parsed.trips.length > 0) {
      parsed.activeTripId = parsed.trips[0].id;
    }
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = DEFAULT_CATEGORIES;
    }
    if (!parsed.sheetsConfig) {
      parsed.sheetsConfig = INITIAL_SHEETS_CONFIG;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return {
      trips: INITIAL_TRIPS,
      activeTripId: INITIAL_TRIPS[0]?.id || null,
      participants: INITIAL_PARTICIPANTS,
      categories: DEFAULT_CATEGORIES,
      expenses: INITIAL_EXPENSES,
      settlements: INITIAL_SETTLEMENTS,
      sheetsConfig: INITIAL_SHEETS_CONFIG,
    };
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

export function resetToDemoData(): AppState {
  const state: AppState = {
    trips: INITIAL_TRIPS,
    activeTripId: INITIAL_TRIPS[0].id,
    participants: INITIAL_PARTICIPANTS,
    categories: DEFAULT_CATEGORIES,
    expenses: INITIAL_EXPENSES,
    settlements: INITIAL_SETTLEMENTS,
    sheetsConfig: INITIAL_SHEETS_CONFIG,
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
