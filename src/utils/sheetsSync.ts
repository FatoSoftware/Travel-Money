import { AppState, Trip, Expense, Participant, Category, Settlement } from '../types';
import { formatDate } from './calculations';

/**
 * Generates a full Google Apps Script code that the user can copy-paste into Google Sheets
 * via Extensions > Apps Script to create a fully automatic 2-way sync backend!
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ========================================================
 * TRAVEL MONEY - SCRIPT DE SINCRONIZACIÓN GOOGLE SHEETS
 * ========================================================
 * Instrucciones:
 * 1. En tu hoja de Google Sheets, ve a: Extensiones > Apps Script.
 * 2. Borra el código existente y pega todo este contenido.
 * 3. Haz clic en "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 4. Selecciona tipo: "Aplicación web".
 * 5. Descripción: "Travel Money Sync API".
 * 6. Ejecutar como: "Yo (tu correo)".
 * 7. Quién tiene acceso: "Cualquier usuario" (Anyone).
 * 8. Haz clic en "Implementar" y autoriza los permisos.
 * 9. Copia la URL de la aplicación web generada y pégala en tu app Travel Money!
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = getSpreadsheetData(ss);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: data
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
    const raw = e.postData.contents;
    const payload = JSON.parse(raw);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'sync') {
      saveDataToSpreadsheet(ss, payload.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Datos sincronizados correctamente con Google Sheets',
        syncedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción no reconocida'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveDataToSpreadsheet(ss, data) {
  // 1. Sheet: Viajes
  let tripSheet = ss.getSheetByName('Viajes') || ss.insertSheet('Viajes');
  tripSheet.clear();
  tripSheet.appendRow(['ID', 'Nombre', 'Descripción', 'Fecha Inicio', 'Fecha Fin', 'Moneda Base', 'Monedas Usadas', 'Emoji']);
  tripSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4D96FF').setFontColor('#FFFFFF');
  (data.trips || []).forEach(t => {
    tripSheet.appendRow([t.id, t.name, t.description || '', t.startDate, t.endDate, t.baseCurrency, (t.currencies || []).join(', '), t.coverEmoji || '✈️']);
  });

  // 2. Sheet: Gastos
  let expSheet = ss.getSheetByName('Gastos') || ss.insertSheet('Gastos');
  expSheet.clear();
  expSheet.appendRow(['ID Gasto', 'ID Viaje', 'Título', 'Importe', 'Moneda', 'Tasa Cambio', 'Importe en Base', 'Pagado Por', 'Tipo Pago', 'Categoría', 'Lugar', 'Localidad', 'Fecha', 'Notas']);
  expSheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#FF6B6B').setFontColor('#FFFFFF');
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

  // 3. Sheet: Participantes
  let partSheet = ss.getSheetByName('Participantes') || ss.insertSheet('Participantes');
  partSheet.clear();
  partSheet.appendRow(['ID', 'ID Viaje', 'Nombre', 'Avatar', 'Color']);
  partSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#6BCB77').setFontColor('#FFFFFF');
  (data.participants || []).forEach(p => {
    partSheet.appendRow([p.id, p.tripId, p.name, p.avatar || '👤', p.color || '#4D96FF']);
  });

  // 4. Sheet: Categorías
  let catSheet = ss.getSheetByName('Categorías') || ss.insertSheet('Categorías');
  catSheet.clear();
  catSheet.appendRow(['ID', 'Nombre', 'Icono', 'Color']);
  catSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#9B51E0').setFontColor('#FFFFFF');
  (data.categories || []).forEach(c => {
    catSheet.appendRow([c.id, c.name, c.icon || 'Tag', c.color || '#FF6B6B']);
  });

  // 5. Sheet: Liquidaciones
  let setSheet = ss.getSheetByName('Liquidaciones') || ss.insertSheet('Liquidaciones');
  setSheet.clear();
  setSheet.appendRow(['ID', 'ID Viaje', 'Deudor', 'Acreedor', 'Importe', 'Moneda', 'Fecha', 'Estado']);
  setSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#FFD93D').setFontColor('#000000');
  (data.settlements || []).forEach(s => {
    setSheet.appendRow([s.id, s.tripId, s.fromParticipantId, s.toParticipantId, s.amount, s.currency, s.date, s.status]);
  });
}

function getSpreadsheetData(ss) {
  // Read back structured JSON from Sheets
  const result = { trips: [], expenses: [], participants: [], categories: [], settlements: [] };

  const tripSheet = ss.getSheetByName('Viajes');
  if (tripSheet && tripSheet.getLastRow() > 1) {
    const rows = tripSheet.getRange(2, 1, tripSheet.getLastRow() - 1, 8).getValues();
    result.trips = rows.map(r => ({
      id: String(r[0]),
      name: String(r[1]),
      description: String(r[2]),
      startDate: String(r[3]),
      endDate: String(r[4]),
      baseCurrency: String(r[5] || 'EUR'),
      currencies: String(r[6] || 'EUR').split(',').map(c => c.trim()),
      exchangeRates: { [String(r[5] || 'EUR')]: 1 },
      coverEmoji: String(r[7] || '✈️'),
      coverGradient: 'from-rose-500 via-pink-500 to-amber-400',
      createdAt: new Date().toISOString()
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
 * Syncs app state to Google Apps Script Webhook
 */
export async function syncWithGoogleSheetsWebhook(
  webhookUrl: string,
  state: AppState
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
    throw new Error('La URL debe ser una URL válida de Google Apps Script (https://script.google.com/...)');
  }

  const payload = {
    action: 'sync',
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
      'Content-Type': 'text/plain;charset=utf-8', // Apps script prefers text/plain for CORS preflight
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
  };
}
