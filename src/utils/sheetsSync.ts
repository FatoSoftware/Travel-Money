import { AppState, Trip, Expense, Participant, Category, Settlement } from '../types';
import { getPersistentWebhookUrl, getTombstones, setPersistentWebhookUrl } from './storage';

/**
 * Generates robust Google Apps Script code with multi-cell chunking and full metadata preservation
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * TRAVEL MONEY - SERVICIO DE SINCRONIZACIÓN EN LA NUBE V3 (ALTA DISPONIBILIDAD)
 * =========================================================================
 * Instrucciones:
 * 1. En tu hoja de Google Sheets ve a: Extensiones > Apps Script
 * 2. Borra TODO el código y pega este contenido.
 * 3. Haz clic en "Implementar" (arriba a la derecha):
 *    - Si ya existía: "Gestionar implementaciones" > Editar (lápiz) > Versión: "Nueva versión" > Implementar.
 *    - Si es nueva: "Nueva implementación" > Tipo: "Aplicación web".
 * 4. Configuración:
 *    - Ejecutar como: "Yo (tu correo)"
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 5. Haz clic en "Implementar" y autoriza los permisos. Copia la URL generada.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = getCompleteData(ss);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: data,
      tripsCount: (data.trips || []).length,
      expensesCount: (data.expenses || []).length,
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

    // 1. PING / TEST
    if (payload.action === 'ping' || payload.action === 'test') {
      const data = getCompleteData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Conexión exitosa con Google Sheets',
        tripsCount: (data.trips || []).length,
        expensesCount: (data.expenses || []).length,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. PULL
    if (payload.action === 'pull' || payload.action === 'fetch') {
      const data = getCompleteData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: data,
        tripsCount: (data.trips || []).length,
        expensesCount: (data.expenses || []).length,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. PUSH / SYNC
    if (payload.action === 'sync' || payload.action === 'push') {
      const incomingData = payload.data || {};
      const savedData = saveAndMergeData(ss, incomingData, payload.merge !== false);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Sincronizado correctamente',
        data: savedData,
        tripsCount: (savedData.trips || []).length,
        expensesCount: (savedData.expenses || []).length,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción desconocida: ' + payload.action
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCompleteData(ss) {
  // 1. Intentar leer desde _APP_DB_ (soporta datos fragmentados en múltiples celdas)
  let dbSheet = ss.getSheetByName('_APP_DB_');
  if (dbSheet && dbSheet.getLastRow() >= 1) {
    try {
      const numRows = dbSheet.getLastRow();
      const rows = dbSheet.getRange(1, 1, numRows, 1).getValues();
      let fullJsonStr = '';
      for (let i = 0; i < rows.length; i++) {
        fullJsonStr += String(rows[i][0] || '');
      }
      if (fullJsonStr && fullJsonStr.trim().startsWith('{')) {
        const parsed = JSON.parse(fullJsonStr);
        if (parsed && (Array.isArray(parsed.trips) || Array.isArray(parsed.expenses))) {
          return {
            trips: parsed.trips || [],
            expenses: parsed.expenses || [],
            participants: parsed.participants || [],
            categories: parsed.categories || [],
            settlements: parsed.settlements || []
          };
        }
      }
    } catch (e) {}
  }

  // 2. Si _APP_DB_ no tiene datos válidos, leer de las tablas visuales
  return readFromVisualSheets(ss);
}

function saveAndMergeData(ss, incomingData, doMerge) {
  let finalData = incomingData;

  if (doMerge) {
    const existing = getCompleteData(ss);
    if (existing && (existing.trips?.length > 0 || existing.expenses?.length > 0)) {
      finalData = mergeDataSets(existing, incomingData);
    }
  }

  // Guardar en _APP_DB_ dividiendo en chunks de 30000 caracteres
  let dbSheet = ss.getSheetByName('_APP_DB_');
  if (!dbSheet) {
    dbSheet = ss.insertSheet('_APP_DB_');
    try { dbSheet.hideSheet(); } catch (e) {}
  }
  dbSheet.clear();

  const jsonStr = JSON.stringify(finalData);
  const CHUNK_SIZE = 30000;
  const chunks = [];
  for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
    chunks.push([jsonStr.substring(i, i + CHUNK_SIZE)]);
  }
  if (chunks.length > 0) {
    dbSheet.getRange(1, 1, chunks.length, 1).setValues(chunks);
  }

  // Renderizar hojas visuales con formato amigable
  renderVisualSheets(ss, finalData);

  return finalData;
}

function mergeDataSets(existing, incoming) {
  function mergeArray(arr1, arr2) {
    const map = {};
    (arr1 || []).forEach(item => {
      if (item && item.id) map[item.id] = item;
    });
    (arr2 || []).forEach(item => {
      if (item && item.id) {
        // Si ya existe, conservar el que tenga updatedAt más reciente
        if (map[item.id]) {
          const oldTime = map[item.id].updatedAt || map[item.id].createdAt || '';
          const newTime = item.updatedAt || item.createdAt || '';
          if (newTime >= oldTime) {
            map[item.id] = item;
          }
        } else {
          map[item.id] = item;
        }
      }
    });
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
  // 1. Viajes
  let tripSheet = ss.getSheetByName('Viajes') || ss.insertSheet('Viajes');
  tripSheet.clear();
  tripSheet.appendRow(['ID', 'Nombre', 'Descripción', 'Fecha Inicio', 'Fecha Fin', 'Moneda Base', 'Monedas Usadas', 'Emoji', 'JSON Tasas']);
  tripSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#4F46E5').setFontColor('#FFFFFF');
  (data.trips || []).forEach(t => {
    tripSheet.appendRow([
      t.id,
      t.name,
      t.description || '',
      t.startDate,
      t.endDate,
      t.baseCurrency,
      (t.currencies || []).join(', '),
      t.coverEmoji || '✈️',
      JSON.stringify(t.exchangeRates || {})
    ]);
  });

  // 2. Gastos
  let expSheet = ss.getSheetByName('Gastos') || ss.insertSheet('Gastos');
  expSheet.clear();
  expSheet.appendRow(['ID Gasto', 'ID Viaje', 'Título', 'Importe', 'Moneda', 'Tasa Cambio', 'Importe Base', 'Pagado Por (ID)', 'Tipo Pago', 'Categoría (ID)', 'Lugar', 'Localidad', 'Fecha', 'Notas', 'División (JSON)', 'Tipo Split']);
  expSheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#E11D48').setFontColor('#FFFFFF');
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
      e.notes || '',
      JSON.stringify(e.splits || []),
      e.splitType || 'equal'
    ]);
  });

  // 3. Participantes
  let partSheet = ss.getSheetByName('Participantes') || ss.insertSheet('Participantes');
  partSheet.clear();
  partSheet.appendRow(['ID', 'ID Viaje', 'Nombre', 'Avatar', 'Color', 'Peso']);
  partSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#059669').setFontColor('#FFFFFF');
  (data.participants || []).forEach(p => {
    partSheet.appendRow([p.id, p.tripId, p.name, p.avatar || '👤', p.color || '#4F46E5', p.weight || 1]);
  });

  // 4. Categorías
  let catSheet = ss.getSheetByName('Categorías') || ss.insertSheet('Categorías');
  catSheet.clear();
  catSheet.appendRow(['ID', 'Nombre', 'Icono', 'Color']);
  catSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#7C3AED').setFontColor('#FFFFFF');
  (data.categories || []).forEach(c => {
    catSheet.appendRow([c.id, c.name, c.icon || 'Tag', c.color || '#E11D48']);
  });

  // 5. Liquidaciones
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
    const rows = tripSheet.getRange(2, 1, tripSheet.getLastRow() - 1, 9).getValues();
    result.trips = rows.map(r => {
      let rates = { [String(r[5] || 'EUR')]: 1 };
      try { rates = JSON.parse(r[8]); } catch(e) {}
      return {
        id: String(r[0] || 'trip-' + Date.now()),
        name: String(r[1] || 'Mi Viaje'),
        description: String(r[2] || ''),
        startDate: String(r[3] || ''),
        endDate: String(r[4] || ''),
        baseCurrency: String(r[5] || 'EUR'),
        currencies: String(r[6] || 'EUR').split(',').map(c => c.trim()),
        exchangeRates: rates,
        coverEmoji: String(r[7] || '✈️'),
        coverGradient: 'from-indigo-600 to-rose-500',
        createdAt: new Date().toISOString()
      };
    });
  }

  const expSheet = ss.getSheetByName('Gastos');
  if (expSheet && expSheet.getLastRow() > 1) {
    const rows = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, 16).getValues();
    result.expenses = rows.map(r => {
      let splits = [];
      try { splits = JSON.parse(r[14]); } catch(e) {}
      return {
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
        splits: Array.isArray(splits) ? splits : [],
        splitType: String(r[15] || 'equal'),
        createdAt: new Date().toISOString()
      };
    });
  }

  const partSheet = ss.getSheetByName('Participantes');
  if (partSheet && partSheet.getLastRow() > 1) {
    const rows = partSheet.getRange(2, 1, partSheet.getLastRow() - 1, 6).getValues();
    result.participants = rows.map(r => ({
      id: String(r[0]),
      tripId: String(r[1]),
      name: String(r[2]),
      avatar: String(r[3] || '👤'),
      color: String(r[4] || '#4F46E5'),
      weight: Number(r[5]) || 1
    }));
  }

  return result;
}
`;
}

/**
 * Tests connection to Google Apps Script Webhook (PING)
 */
export async function testGoogleSheetsConnection(
  webhookUrl: string
): Promise<{ success: boolean; message: string; tripsCount?: number; expensesCount?: number }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
    return {
      success: false,
      message: 'La URL debe comenzar por https://script.google.com/macros/s/...',
    };
  }

  try {
    const urlWithParam = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
    const response = await fetch(urlWithParam, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      return {
        success: true,
        message: '¡Conexión verificada con Google Sheets!',
        tripsCount: result.tripsCount || 0,
        expensesCount: result.expensesCount || 0,
      };
    }

    return {
      success: false,
      message: result.message || 'La respuesta de Google Sheets no fue válida',
    };
  } catch (err: any) {
    // Fallback POST ping
    try {
      const postRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
      });
      if (postRes.ok) {
        const postResult = await postRes.json();
        if (postResult.status === 'success') {
          return {
            success: true,
            message: '¡Conexión verificada con Google Sheets!',
            tripsCount: postResult.tripsCount || 0,
            expensesCount: postResult.expensesCount || 0,
          };
        }
      }
    } catch {}

    return {
      success: false,
      message: `No se pudo conectar con Google Sheets (${err.message}). Verifica que el script esté implementado con acceso 'Cualquier usuario'.`,
    };
  }
}

/**
 * Pulls latest state from Google Sheets
 */
export async function pullFromGoogleSheets(
  webhookUrl: string
): Promise<{ success: boolean; data?: Partial<AppState>; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
    throw new Error('La URL debe ser una URL válida de Google Apps Script');
  }

  const urlWithParam = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=pull&_t=${Date.now()}`;

  try {
    const response = await fetch(urlWithParam, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success' && result.data) {
      return {
        success: true,
        data: result.data,
        message: 'Datos descargados correctamente',
      };
    } else {
      throw new Error(result.message || 'Error al obtener datos');
    }
  } catch (err: any) {
    // Fallback POST pull
    try {
      const postResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'pull' }),
      });
      if (postResponse.ok) {
        const postResult = await postResponse.json();
        if (postResult.status === 'success' && postResult.data) {
          return {
            success: true,
            data: postResult.data,
            message: 'Datos descargados correctamente',
          };
        }
      }
    } catch {}

    throw new Error(`Error de conexión con Google Sheets: ${err.message}`);
  }
}

/**
 * Pushes state to Google Sheets
 */
export async function pushToGoogleSheets(
  webhookUrl: string,
  state: AppState
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
    throw new Error('La URL debe ser una URL válida de Google Apps Script');
  }

  const payload = {
    action: 'sync',
    merge: true,
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
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en servidor de Google Sheets: HTTP ${response.status}`);
  }

  const result = await response.json();
  return {
    success: result.status === 'success',
    message: result.message || 'Sincronizado correctamente con Google Sheets',
    data: result.data,
  };
}

export const syncWithGoogleSheetsWebhook = pushToGoogleSheets;

/**
 * Non-destructive CRDT merge: Respects tombstones, keeps local unpushed items, and merges by ID + timestamp
 */
export function smartMergeStates(local: AppState, remote: Partial<AppState>): AppState {
  const tombstones = getTombstones();
  const persistentWebhook = getPersistentWebhookUrl() || local.sheetsConfig?.webhookUrl || '';

  const remoteTrips = Array.isArray(remote.trips) ? remote.trips : [];
  const remoteExpenses = Array.isArray(remote.expenses) ? remote.expenses : [];
  const remoteParticipants = Array.isArray(remote.participants) ? remote.participants : [];
  const remoteCategories = Array.isArray(remote.categories) ? remote.categories : [];
  const remoteSettlements = Array.isArray(remote.settlements) ? remote.settlements : [];

  // Helper to merge items non-destructively
  const mergeCollection = <T extends { id: string; updatedAt?: string; createdAt?: string }>(
    localArr: T[],
    remoteArr: T[],
    tombstoneIds: string[]
  ): T[] => {
    const map = new Map<string, T>();

    // 1. Add local items first (unless tombstoned)
    (localArr || []).forEach((item) => {
      if (item && item.id && !tombstoneIds.includes(item.id)) {
        map.set(item.id, item);
      }
    });

    // 2. Merge remote items
    (remoteArr || []).forEach((remoteItem) => {
      if (!remoteItem || !remoteItem.id || tombstoneIds.includes(remoteItem.id)) {
        return;
      }

      if (map.has(remoteItem.id)) {
        const localItem = map.get(remoteItem.id)!;
        const localTime = localItem.updatedAt || localItem.createdAt || '';
        const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || '';

        // If remote is strictly newer, use remote
        if (remoteTime > localTime) {
          // Special safeguard for expenses: preserve local splits if remote splits was lost
          if (
            (localItem as any).splits &&
            (localItem as any).splits.length > 0 &&
            (!(remoteItem as any).splits || (remoteItem as any).splits.length === 0)
          ) {
            map.set(remoteItem.id, {
              ...remoteItem,
              splits: (localItem as any).splits,
              splitType: (localItem as any).splitType || (remoteItem as any).splitType,
            });
          } else {
            map.set(remoteItem.id, remoteItem);
          }
        }
      } else {
        // Remote has an item local didn't have -> Add it safely
        map.set(remoteItem.id, remoteItem);
      }
    });

    return Array.from(map.values());
  };

  const mergedTrips = mergeCollection(local.trips, remoteTrips, tombstones.trips);
  const mergedExpenses = mergeCollection(local.expenses, remoteExpenses, tombstones.expenses);
  const mergedParticipants = mergeCollection(local.participants, remoteParticipants, tombstones.participants);
  const mergedCategories = remoteCategories.length > 0
    ? mergeCollection(local.categories, remoteCategories, [])
    : local.categories;
  const mergedSettlements = mergeCollection(local.settlements, remoteSettlements, []);

  // Ensure activeTripId remains valid
  let nextActiveTripId = local.activeTripId;
  if ((!nextActiveTripId || !mergedTrips.some((t) => t.id === nextActiveTripId)) && mergedTrips.length > 0) {
    nextActiveTripId = mergedTrips[0].id;
  }

  return {
    trips: mergedTrips.length > 0 ? mergedTrips : local.trips,
    activeTripId: nextActiveTripId,
    expenses: mergedExpenses,
    participants: mergedParticipants.length > 0 ? mergedParticipants : local.participants,
    categories: mergedCategories.length > 0 ? mergedCategories : local.categories,
    settlements: mergedSettlements,
    sheetsConfig: {
      ...local.sheetsConfig,
      webhookUrl: persistentWebhook,
      autoSync: local.sheetsConfig?.autoSync !== false,
      lastSyncDate: new Date().toISOString(),
      syncStatus: 'success',
      errorMessage: undefined,
    },
  };
}

/**
 * Performs full 2-way sync with guaranteed state merging
 */
export async function performTwoWaySync(
  webhookUrl: string,
  localState: AppState
): Promise<{ success: boolean; mergedState: AppState; message: string }> {
  try {
    // 1. PULL
    const pullResult = await pullFromGoogleSheets(webhookUrl);
    let unifiedState = localState;
    if (pullResult.success && pullResult.data) {
      unifiedState = smartMergeStates(localState, pullResult.data);
    }

    // 2. PUSH unified state back so all other users get everything
    await pushToGoogleSheets(webhookUrl, unifiedState);

    return {
      success: true,
      mergedState: unifiedState,
      message: `Sincronización completada (${unifiedState.expenses.length} gastos guardados)`,
    };
  } catch (err: any) {
    // Fallback: If pull fails, at least push local
    try {
      await pushToGoogleSheets(webhookUrl, localState);
      return {
        success: true,
        mergedState: localState,
        message: 'Datos locales guardados en Google Sheets',
      };
    } catch (pushErr: any) {
      throw new Error(err.message || pushErr.message);
    }
  }
}

/**
 * Exports single trip or entire app state to CSV format
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


