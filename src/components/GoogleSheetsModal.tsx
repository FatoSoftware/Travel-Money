import React, { useState } from 'react';
import { AppState, Trip, Expense, Participant, Category, GoogleSheetsConfig } from '../types';
import {
  exportExpensesToCSV,
  downloadCSV,
  generateGoogleAppsScriptCode,
  syncWithGoogleSheetsWebhook,
} from '../utils/sheetsSync';
import { exportBackupJSON, importBackupJSON } from '../utils/storage';
import {
  Table,
  X,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  appState: AppState;
  onUpdateSheetsConfig: (config: GoogleSheetsConfig) => void;
  onRestoreState: (newState: AppState) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  trip,
  appState,
  onUpdateSheetsConfig,
  onRestoreState,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(appState.sheetsConfig?.webhookUrl || '');
  const [autoSync, setAutoSync] = useState(appState.sheetsConfig?.autoSync !== false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  const handleExportCSV = () => {
    const csvData = exportExpensesToCSV(
      trip,
      appState.expenses,
      appState.participants,
      appState.categories
    );
    const filename = `TravelMoney_${trip.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, csvData);
  };

  const handleCopyAppsScript = () => {
    const code = generateGoogleAppsScriptCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleSaveAndSync = async () => {
    if (!webhookUrl.trim()) {
      alert('Por favor introduce la URL de tu aplicación web de Google Apps Script');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await syncWithGoogleSheetsWebhook(webhookUrl.trim(), appState);
      setSyncResult(res);
      onUpdateSheetsConfig({
        ...appState.sheetsConfig,
        webhookUrl: webhookUrl.trim(),
        autoSync: autoSync,
        lastSyncDate: new Date().toISOString(),
        syncStatus: 'success',
      });
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Error al conectar con Google Sheets',
      });
      onUpdateSheetsConfig({
        ...appState.sheetsConfig,
        webhookUrl: webhookUrl.trim(),
        autoSync: autoSync,
        syncStatus: 'error',
        errorMessage: err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    onUpdateSheetsConfig({
      ...appState.sheetsConfig,
      webhookUrl: webhookUrl.trim(),
      autoSync: enabled,
    });
  };

  const handleExportJSON = () => {
    const jsonStr = exportBackupJSON(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravelMoney_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const newState = importBackupJSON(text);
        onRestoreState(newState);
        alert('✅ Copia de seguridad importada con éxito');
        onClose();
      } catch (err: any) {
        alert(`❌ Error al importar copia: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-indigo-100 text-slate-900 w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-indigo-950">Base de Datos Google Sheets</h3>
              <p className="text-xs text-slate-500">Sincronización y copias de seguridad de tus viajes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Option 1: Direct 1-Click CSV Export for Google Sheets */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-slate-900">Exportación Directa a Google Sheets (CSV)</h4>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                Instantáneo
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Descarga un archivo con formato optimizado para Google Sheets o Excel con todos los gastos de <strong className="text-slate-900">"{trip.name}"</strong>, incluyendo monedas, categorías, localidades y participantes.
            </p>

            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Descargar CSV para Google Sheets
            </button>
          </div>

          {/* Option 2: Live 2-Way Sync via Google Apps Script Webhook */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-900">Sincronización en la Nube (Apps Script)</h4>
              </div>
              <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                Auto-Sync
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Conecta tu propia hoja de Google Sheets en tiempo real pegando el script gratuito oficial de Travel Money en tu cuenta de Google.
            </p>

            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                URL de tu Aplicación Web de Google Sheets
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Guardando...' : 'Sincronizar'}
                </button>
              </div>
            </div>

            {/* Auto-Sync Toggle Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Sincronización Automática en Tiempo Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Guarda automáticamente en Google Drive cada vez que añades, editas o eliminas un gasto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAutoSync(!autoSync)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                  autoSync ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    autoSync ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sync Feedback Message */}
            {syncResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{syncResult.message}</span>
              </div>
            )}

            {/* Quick Tutorial Toggle */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">¿Cómo crear tu base de datos en 1 minuto?</span>
                <button
                  onClick={handleCopyAppsScript}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '¡Script Copiado!' : 'Copiar Código Google Script'}</span>
                </button>
              </div>

              <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p>1. Abre una hoja nueva en <strong className="text-slate-900">Google Sheets</strong>.</p>
                <p>2. Ve al menú superior <strong className="text-slate-900">Extensiones &gt; Apps Script</strong>.</p>
                <p>3. Pega el código copiado arriba y haz clic en <strong className="text-slate-900">Implementar &gt; Nueva implementación</strong>.</p>
                <p>4. Elige tipo <strong className="text-slate-900">"Aplicación web"</strong>, acceso <strong className="text-slate-900">"Cualquier usuario"</strong> y copia la URL generada aquí.</p>
              </div>
            </div>
          </div>

          {/* Option 3: Local Backup JSON (Export & Import) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Copia de Seguridad Completa (Offline / Local)
            </h4>

            <p className="text-xs text-slate-600">
              Guarda un archivo de respaldo con todos tus viajes, gastos, participantes y categorías, o restáuralo en cualquier momento.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Exportar JSON
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs">
                <Upload className="w-4 h-4 text-slate-500" />
                Importar JSON
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
