import { AppState, Trip, Expense, Participant, Category, Settlement } from '../types';
import { formatDate } from './calculations';

/**
 * Generates a full Google Apps Script code that the user can copy-paste into Google Sheets
 * via Extensions > Apps Script to create a fully automatic 2-way sync backend!
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ========================================================
 * TRAVEL MONEY - SCRIPT DE SINCRONIZACIÓN BIDIRECCIONAL V2
 * ========================================================
 * Instrucciones para configurar o actualizar:
 * 1. En tu hoja de Google Sheets, ve a: Extensiones > Apps Script.
 * 2. Borra TODO el código anterior y pega este nuevo código.
 * 3. Haz clic en "Implementar" (arriba a la derecha):
 *    - Si es la primera vez: "Nueva implementación" > Tipo: "Aplicación web".
 *    - Si ya existía: "Gestionar implementaciones" > Icono lápiz (Editar) > Versión: "Nueva versión".
 * 4. Configura:
 *    - Ejecutar como: "Yo (tu correo)".
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone).
 * 5. Haz clic en "Implementar" y autoriza los permisos si los pide.
 * 6. Copia la URL de la aplicación web y pégala en Travel Money.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = getCompleteData(ss);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: data,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // PULL / FETCH
    if (payload.action === 'pull' || payload.action === 'fetch') {
      const data = getCompleteData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: data,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // PUSH / SYNC
    if (payload.action === 'sync' || payload.action === 'push') {
      const incomingData = payload.data || {};
      const savedData = saveAndMergeData(ss, incomingData, payload.merge === true);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Datos sincronizados correctamente con Google Sheets',
        data: savedData,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción no reconocida: ' + payload.action
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCompleteData(ss) {
  // 1. Intentar leer desde el almacén JSON completo _APP_DB_
  let dbSheet = ss.getSheetByName('_APP_DB_');
  if (dbSheet && dbSheet.getLastRow() >= 1) {
    try {
      const cellValue = dbSheet.getRange(1, 1).getValue();
      if (cellValue && typeof cellValue === 'string' && cellValue.trim().startsWith('{')) {
        const parsed = JSON.parse(cellValue);
        if (parsed && (parsed.trips || parsed.expenses)) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 2. Si _APP_DB_ no existe aún, leer de las tablas visuales
  return readFromVisualSheets(ss);
}

function saveAndMergeData(ss, incomingData, doMerge) {
  let finalData = incomingData;

  if (doMerge) {
    const existing = getCompleteData(ss);
    if (existing && existing.trips && existing.trips.length > 0) {
      finalData = mergeDataSets(existing, incomingData);
    }
  }

  // Guardar en _APP_DB_
  let dbSheet = ss.getSheetByName('_APP_DB_');
  if (!dbSheet) {
    dbSheet = ss.insertSheet('_APP_DB_');
    try { dbSheet.hideSheet(); } catch (e) {}
  }
  dbSheet.clear();
  dbSheet.getRange(1, 1).setValue(JSON.stringify(finalData));

  // Renderizar hojas visuales con formato para humanos
  renderVisualSheets(ss, finalData);

  return finalData;
}

function mergeDataSets(existing, incoming) {
  function mergeArray(arr1, arr2) {
    const map = {};
    (arr1 || []).forEach(item => { if (item && item.id) map[item.id] = item; });
    (arr2 || []).forEach(item => { if (item && item.id) map[item.id] = item; });
    return Object.values(map);
  }

  return {
    trips: mergeArray(existing.trips, incoming.trips),
    expenses: mergeArray(existing.expenses, incoming.expenses),
    participants: mergeArray(existing.participants, incoming.participants),
    categories: mergeArray(existing.categories, incoming.categories),
    settlements: mergeArray(existing.settlements, incoming.settlements),
    lastModified: new Date().toISOString()
  };
}

function renderVisualSheets(ss, data) {
  // 1. Hoja: Viajes
  let tripSheet = ss.getSheetByName('Viajes') || ss.insertSheet('Viajes');
  tripSheet.clear();
  tripSheet.appendRow(['ID', 'Nombre', 'Descripción', 'Fecha Inicio', 'Fecha Fin', 'Moneda Base', 'Monedas Usadas', 'Emoji']);
  tripSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4F46E5').setFontColor('#FFFFFF');
  (data.trips || []).forEach(t => {
    tripSheet.appendRow([t.id, t.name, t.description || '', t.startDate, t.endDate, t.baseCurrency, (t.currencies || []).join(', '), t.coverEmoji || '✈️']);
  });

  // 2. Hoja: Gastos
  let expSheet = ss.getSheetByName('Gastos') || ss.insertSheet('Gastos');
  expSheet.clear();
  expSheet.appendRow(['ID Gasto', 'ID Viaje', 'Título', 'Importe', 'Moneda', 'Tasa Cambio', 'Importe en Base', 'Pagado Por (ID)', 'Tipo Pago', 'Categoría (ID)', 'Lugar', 'Localidad', 'Fecha', 'Notas']);
  expSheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#E11D48').setFontColor('#FFFFFF');
  (data.expenses || []).forEach(e => {
    expSheet.appendRow([
      e.id,
      e.tripId,
      e.title,
      e.amount,
      e.currency,
      e.exchangeRate || 1,
      e.amountInBaseCurrency,
      e.paidById,
      e.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta',
      e.categoryId,
      e.locationName || '',
      e.locality || '',
      e.date,
      e.notes || ''
    ]);
  });

  // 3. Hoja: Participantes
  let partSheet = ss.getSheetByName('Participantes') || ss.insertSheet('Participantes');
  partSheet.clear();
  partSheet.appendRow(['ID', 'ID Viaje', 'Nombre', 'Avatar', 'Color']);
  partSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#059669').setFontColor('#FFFFFF');
  (data.participants || []).forEach(p => {
    partSheet.appendRow([p.id, p.tripId, p.name, p.avatar || '👤', p.color || '#4F46E5']);
  });

  // 4. Hoja: Categorías
  let catSheet = ss.getSheetByName('Categorías') || ss.insertSheet('Categorías');
  catSheet.clear();
  catSheet.appendRow(['ID', 'Nombre', 'Icono', 'Color']);
  catSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#7C3AED').setFontColor('#FFFFFF');
  (data.categories || []).forEach(c => {
    catSheet.appendRow([c.id, c.name, c.icon || 'Tag', c.color || '#E11D48']);
  });

  // 5. Hoja: Liquidaciones
  let setSheet = ss.getSheetByName('Liquidaciones') || ss.insertSheet('Liquidaciones');
  setSheet.clear();
  setSheet.appendRow(['ID', 'ID Viaje', 'Deudor (ID)', 'Acreedor (ID)', 'Importe', 'Moneda', 'Fecha', 'Estado']);
  setSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#D97706').setFontColor('#FFFFFF');
  (data.settlements || []).forEach(s => {
    setSheet.appendRow([s.id, s.tripId, s.fromParticipantId, s.toParticipantId, s.amount, s.currency, s.date, s.status]);
  });
}

function readFromVisualSheets(ss) {
  const result = { trips: [], expenses: [], participants: [], categories: [], settlements: [] };

  const tripSheet = ss.getSheetByName('Viajes');
  if (tripSheet && tripSheet.getLastRow() > 1) {
    const rows = tripSheet.getRange(2, 1, tripSheet.getLastRow() - 1, 8).getValues();
    result.trips = rows.map(r => ({
      id: String(r[0] || 'trip-' + Date.now()),
      name: String(r[1] || 'Mi Viaje'),
      description: String(r[2] || ''),
      startDate: String(r[3] || ''),
      endDate: String(r[4] || ''),
      baseCurrency: String(r[5] || 'EUR'),
      currencies: String(r[6] || 'EUR').split(',').map(c => c.trim()),
      exchangeRates: { [String(r[5] || 'EUR')]: 1 },
      coverEmoji: String(r[7] || '✈️'),
      coverGradient: 'from-indigo-600 to-rose-500',
      createdAt: new Date().toISOString()
    }));
  }

  const expSheet = ss.getSheetByName('Gastos');
  if (expSheet && expSheet.getLastRow() > 1) {
    const rows = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, 14).getValues();
    result.expenses = rows.map(r => ({
      id: String(r[0]),
      tripId: String(r[1]),
      title: String(r[2]),
      amount: Number(r[3]) || 0,
      currency: String(r[4] || 'EUR'),
      exchangeRate: Number(r[5]) || 1,
      amountInBaseCurrency: Number(r[6]) || 0,
      paidById: String(r[7]),
      paymentType: String(r[8]).toLowerCase().includes('efect') ? 'cash' : 'card',
      categoryId: String(r[9]),
      locationName: String(r[10] || ''),
      locality: String(r[11] || ''),
      date: String(r[12] || ''),
      notes: String(r[13] || ''),
      splitType: 'equal',
      splits: [],
      createdAt: new Date().toISOString()
    }));
  }

  const partSheet = ss.getSheetByName('Participantes');
  if (partSheet && partSheet.getLastRow() > 1) {
    const rows = partSheet.getRange(2, 1, partSheet.getLastRow() - 1, 5).getValues();
    result.participants = rows.map(r => ({
      id: String(r[0]),
      tripId: String(r[1]),
      name: String(r[2]),
      avatar: String(r[3] || '👤'),
      color: String(r[4] || '#4F46E5'),
      weight: 1
    }));
  }

  return result;
}
`;
}

/**
 * Exports single trip or entire app state to CSV format ready for Google Sheets / Excel
 */
export function exportExpensesToCSV(
  trip: Trip,
  expenses: Expense[],
  participants: Participant[],
  categories: Category[]
): string {
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
  const partMap = new Map(participants.map((p) => [p.id, p.name]));
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    'Fecha',
    'Título del Gasto',
    'Categoría',
    'Pagado Por',
    'Importe Original',
    'Moneda',
    'Tasa de Cambio',
    `Importe en Base (${trip.baseCurrency})`,
    'Tipo de Pago',
    'Lugar',
    'Localidad / Ciudad',
    'Notas',
  ];

  const rows = tripExpenses.map((e) => {
    const catName = catMap.get(e.categoryId) || 'Otros';
    const payerName = partMap.get(e.paidById) || 'Desconocido';
    const paymentLabel = e.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta';

    return [
      `"${e.date}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${catName}"`,
      `"${payerName}"`,
      e.amount,
      `"${e.currency}"`,
      e.exchangeRate || 1,
      e.amountInBaseCurrency,
      `"${paymentLabel}"`,
      `"${(e.locationName || '').replace(/"/g, '""')}"`,
      `"${(e.locality || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\r\n');
}

/**
 * Downloads a CSV file in browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Pulls the latest state from Google Sheets Webhook (PULL)
 */
export async function pullFromGoogleSheets(
  webhookUrl: string
): Promise<{ success: boolean; data?: Partial<AppState>; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
    throw new Error('La URL debe ser una URL válida de Google Apps Script (https://script.google.com/...)');
  }

  const urlWithParam = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=pull&_t=${Date.now()}`;

  try {
    const response = await fetch(urlWithParam, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success' && result.data) {
      return {
        success: true,
        data: result.data,
        message: 'Datos descargados correctamente desde Google Sheets',
      };
    } else {
      throw new Error(result.message || 'No se pudieron obtener los datos de la hoja');
    }
  } catch (err: any) {
    // Fallback: Try POST with action: 'pull' in case GET is restricted
    try {
      const postResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'pull' }),
      });
      if (postResponse.ok) {
        const postResult = await postResponse.json();
        if (postResult.status === 'success' && postResult.data) {
          return {
            success: true,
            data: postResult.data,
            message: 'Datos descargados correctamente desde Google Sheets',
          };
        }
      }
    } catch (fallbackErr) {}

    throw new Error(`Error al leer de Google Sheets: ${err.message}`);
  }
}

/**
 * Pushes state to Google Sheets Webhook (PUSH)
 */
export async function pushToGoogleSheets(
  webhookUrl: string,
  state: AppState
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
    throw new Error('La URL debe ser una URL válida de Google Apps Script (https://script.google.com/...)');
  }

  const payload = {
    action: 'sync',
    merge: false,
    data: {
      trips: state.trips,
      participants: state.participants,
      categories: state.categories,
      expenses: state.expenses,
      settlements: state.settlements,
    },
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor de Google Sheets: HTTP ${response.status}`);
  }

  const result = await response.json();
  return {
    success: result.status === 'success',
    message: result.message || 'Sincronizado correctamente con Google Sheets',
    data: result.data,
  };
}

/**
 * Alias for backward compatibility
 */
export const syncWithGoogleSheetsWebhook = pushToGoogleSheets;

/**
 * Smartly merges local state and remote Google Sheets state
 */
export function smartMergeStates(local: AppState, remote: Partial<AppState>): AppState {
  const remoteTrips = Array.isArray(remote.trips) ? remote.trips : [];
  const remoteExpenses = Array.isArray(remote.expenses) ? remote.expenses : [];
  const remoteParticipants = Array.isArray(remote.participants) ? remote.participants : [];
  const remoteCategories = Array.isArray(remote.categories) ? remote.categories : [];
  const remoteSettlements = Array.isArray(remote.settlements) ? remote.settlements : [];

  // Check if local state is purely unedited demo data
  const isLocalPureDemo =
    local.trips.length > 0 &&
    local.trips.every((t) => t.id === 'trip-japan-2024' || t.id === 'trip-rome-2024') &&
    remoteTrips.length > 0 &&
    !remoteTrips.some((t) => t.id === 'trip-japan-2024' || t.id === 'trip-rome-2024');

  // If local was just default demo and remote has real trips, remote completely takes precedence
  if (isLocalPureDemo && remoteTrips.length > 0) {
    const activeId = remoteTrips.some((t) => t.id === local.activeTripId)
      ? local.activeTripId
      : remoteTrips[0].id;

    return {
      ...local,
      trips: remoteTrips,
      activeTripId: activeId,
      expenses: remoteExpenses,
      participants: remoteParticipants.length > 0 ? remoteParticipants : local.participants,
      categories: remoteCategories.length > 0 ? remoteCategories : local.categories,
      settlements: remoteSettlements,
      sheetsConfig: {
        ...local.sheetsConfig,
        lastSyncDate: new Date().toISOString(),
        syncStatus: 'success',
        errorMessage: undefined,
      },
    };
  }

  // Helper to merge items by ID (remote item preferred if conflict, plus keeping any unique local ones)
  const mergeById = <T extends { id: string }>(localArr: T[], remoteArr: T[]): T[] => {
    const map = new Map<string, T>();
    // Add remote first
    remoteArr.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    // Add local items (if already in remote, remote wins unless local has newer info)
    localArr.forEach((item) => {
      if (item && item.id) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  };

  const mergedTrips = remoteTrips.length > 0 ? mergeById(local.trips, remoteTrips) : local.trips;
  const mergedExpenses = remoteExpenses.length > 0 ? mergeById(local.expenses, remoteExpenses) : local.expenses;
  const mergedParticipants =
    remoteParticipants.length > 0 ? mergeById(local.participants, remoteParticipants) : local.participants;
  const mergedCategories =
    remoteCategories.length > 0 ? mergeById(local.categories, remoteCategories) : local.categories;
  const mergedSettlements =
    remoteSettlements.length > 0 ? mergeById(local.settlements, remoteSettlements) : local.settlements;

  // Ensure active trip is valid
  let nextActiveTripId = local.activeTripId;
  if (!mergedTrips.some((t) => t.id === nextActiveTripId) && mergedTrips.length > 0) {
    nextActiveTripId = mergedTrips[0].id;
  }

  return {
    ...local,
    trips: mergedTrips,
    activeTripId: nextActiveTripId,
    expenses: mergedExpenses,
    participants: mergedParticipants,
    categories: mergedCategories,
    settlements: mergedSettlements,
    sheetsConfig: {
      ...local.sheetsConfig,
      lastSyncDate: new Date().toISOString(),
      syncStatus: 'success',
      errorMessage: undefined,
    },
  };
}

/**
 * Performs full 2-way sync: Pulls remote data, merges with local state, then pushes unified state.
 */
export async function performTwoWaySync(
  webhookUrl: string,
  localState: AppState
): Promise<{ success: boolean; mergedState: AppState; message: string }> {
  try {
    // 1. PULL latest data from Sheets
    const pullResult = await pullFromGoogleSheets(webhookUrl);

    let unifiedState = localState;
    if (pullResult.success && pullResult.data && pullResult.data.trips && pullResult.data.trips.length > 0) {
      unifiedState = smartMergeStates(localState, pullResult.data);
    }

    // 2. PUSH unified state back to Sheets so all travelers see the complete merged data
    await pushToGoogleSheets(webhookUrl, unifiedState);

    return {
      success: true,
      mergedState: {
        ...unifiedState,
        sheetsConfig: {
          ...unifiedState.sheetsConfig,
          lastSyncDate: new Date().toISOString(),
          syncStatus: 'success',
          errorMessage: undefined,
        },
      },
      message: 'Sincronización bidireccional completada con éxito',
    };
  } catch (err: any) {
    // If pull fails because sheet is fresh/empty, try pushing local
    try {
      await pushToGoogleSheets(webhookUrl, localState);
      return {
        success: true,
        mergedState: {
          ...localState,
          sheetsConfig: {
            ...localState.sheetsConfig,
            lastSyncDate: new Date().toISOString(),
            syncStatus: 'success',
            errorMessage: undefined,
          },
        },
        message: 'Hoja inicializada y datos subidos a Google Sheets',
      };
    } catch (pushErr: any) {
      throw new Error(err.message || pushErr.message);
    }
  }
}

