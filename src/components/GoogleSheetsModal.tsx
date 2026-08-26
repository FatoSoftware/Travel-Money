import React, { useState } from 'react';
import { AppState, Trip, Expense, Participant, Category, GoogleSheetsConfig } from '../types';
import {
  exportExpensesToCSV,
  downloadCSV,
  generateGoogleAppsScriptCode,
  pullFromGoogleSheets,
  pushToGoogleSheets,
  performTwoWaySync,
  smartMergeStates,
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
  Share2,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Smartphone,
  MessageCircle,
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
  const [syncType, setSyncType] = useState<'twoway' | 'pull' | 'push' | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

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

  const generateShareLink = () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#sync=${encodeURIComponent(cleanUrl)}`;
  };

  const handleCopyShareLink = () => {
    const link = generateShareLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    const link = generateShareLink();
    if (!link) return;
    const text = encodeURIComponent(
      `✈️ ¡Únete a nuestro viaje "${trip.name}" en Travel Money!\nAbre este enlace para sincronizar todos los gastos compartidos en tiempo real:\n${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // 1. Two-Way Sync (Pull + Merge + Push)
  const handleTwoWaySync = async () => {
    if (!webhookUrl.trim()) {
      alert('Por favor introduce la URL de tu aplicación web de Google Apps Script');
      return;
    }

    setIsSyncing(true);
    setSyncType('twoway');
    setSyncResult(null);

    try {
      const res = await performTwoWaySync(webhookUrl.trim(), appState);
      if (res.success && res.mergedState) {
        onRestoreState(res.mergedState);
      }
      setSyncResult({ success: true, message: res.message });
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
        message: err.message || 'Error en la sincronización con Google Sheets',
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
      setSyncType(null);
    }
  };

  // 2. Pull Only (Download cloud state into local device)
  const handlePullFromSheets = async () => {
    if (!webhookUrl.trim()) {
      alert('Por favor introduce la URL de tu aplicación web de Google Apps Script');
      return;
    }

    setIsSyncing(true);
    setSyncType('pull');
    setSyncResult(null);

    try {
      const res = await pullFromGoogleSheets(webhookUrl.trim());
      if (res.success && res.data && res.data.trips && res.data.trips.length > 0) {
        const merged = smartMergeStates(appState, res.data);
        onRestoreState(merged);
        setSyncResult({
          success: true,
          message: `✅ Descargados ${res.data.expenses?.length || 0} gastos y ${res.data.trips?.length || 0} viajes desde la nube`,
        });
      } else {
        setSyncResult({
          success: true,
          message: 'La hoja de Google Sheets está vacía o sin datos previos.',
        });
      }
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
        message: err.message || 'Error al descargar de Google Sheets',
      });
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  // 3. Push Only (Upload local device state to cloud)
  const handlePushToSheets = async () => {
    if (!webhookUrl.trim()) {
      alert('Por favor introduce la URL de tu aplicación web de Google Apps Script');
      return;
    }

    setIsSyncing(true);
    setSyncType('push');
    setSyncResult(null);

    try {
      const res = await pushToGoogleSheets(webhookUrl.trim(), appState);
      setSyncResult({
        success: true,
        message: '✅ Todos los datos locales se han subido a Google Sheets',
      });
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
        message: err.message || 'Error al subir a Google Sheets',
      });
    } finally {
      setIsSyncing(false);
      setSyncType(null);
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-indigo-950">Sincronización Bidireccional</h3>
              <p className="text-xs text-slate-500">Conecta todos los móviles de tu grupo al mismo Google Sheets</p>
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
          {/* Main 2-Way Sync Engine Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-900">Sincronización en la Nube (Google Sheets)</h4>
              </div>
              <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                2 Vías (Multi-Dispositivo)
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Permite que varios viajeros añadan gastos desde sus propios dispositivos. Los cambios se combinan sin borrar la información de los demás.
            </p>

            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                URL de tu Aplicación Web de Google Sheets
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons: 2-Way Sync, Pull, Push */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleTwoWaySync}
                disabled={isSyncing || !webhookUrl.trim()}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all active:scale-95 sm:col-span-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing && syncType === 'twoway' ? 'animate-spin' : ''}`} />
                {isSyncing && syncType === 'twoway' ? 'Sincronizando...' : 'Sincronizar (2 Vías)'}
              </button>

              <button
                type="button"
                onClick={handlePullFromSheets}
                disabled={isSyncing || !webhookUrl.trim()}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                title="Descargar datos de Google Sheets a este dispositivo"
              >
                <ArrowDownToLine className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing && syncType === 'pull' ? 'animate-bounce' : ''}`} />
                {isSyncing && syncType === 'pull' ? 'Descargando...' : 'Descargar (Pull)'}
              </button>

              <button
                type="button"
                onClick={handlePushToSheets}
                disabled={isSyncing || !webhookUrl.trim()}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                title="Subir datos de este dispositivo a Google Sheets"
              >
                <ArrowUpFromLine className={`w-3.5 h-3.5 text-indigo-600 ${isSyncing && syncType === 'push' ? 'animate-bounce' : ''}`} />
                {isSyncing && syncType === 'push' ? 'Subiendo...' : 'Subir (Push)'}
              </button>
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
                  Actualiza automáticamente en la nube cada vez que añades, editas o abres la app.
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
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
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
                <span className="font-medium">{syncResult.message}</span>
              </div>
            )}
          </div>

          {/* Connect Other Travelers (Share Link) */}
          {webhookUrl.trim() && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-indigo-950">Conectar a los demás viajeros del grupo</h4>
                  <p className="text-xs text-slate-500">Envía este enlace para que se conecten al mismo viaje con 1 clic</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedShareLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                  <span>{copiedShareLink ? '¡Enlace Copiado!' : 'Copiar Enlace de Sincronización'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 Al abrir el enlace en sus móviles, la app configurará la sincronización y descargará todos los gastos de <strong className="text-slate-800">"{trip.name}"</strong> inmediatamente.
              </p>
            </div>
          )}

          {/* Quick Tutorial to Update/Set up Apps Script Code */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Código de Google Apps Script (Versión 2 Bidireccional)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '¡Script Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p>1. En tu hoja de Google Sheets ve a <strong className="text-slate-900">Extensiones &gt; Apps Script</strong>.</p>
              <p>2. Reemplaza el código anterior pegando este nuevo código.</p>
              <p>3. Haz clic en <strong className="text-slate-900">Implementar &gt; Gestionar implementaciones &gt; Editar (lápiz) &gt; Versión: Nueva versión &gt; Implementar</strong>.</p>
              <p>4. Verifica que el acceso sea <strong className="text-slate-900">"Cualquier usuario"</strong> (Anyone).</p>
            </div>
          </div>

          {/* Option: Direct CSV Export */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-slate-900">Descargar Hoja de Cálculo CSV</h4>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Descargar CSV de "{trip.name}"
            </button>
          </div>

          {/* Option: Local Backup JSON (Export & Import) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h4 className="font-extrabold text-xs text-slate-900">Copia de Seguridad Offline (JSON)</h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Exportar JSON
              </button>

              <label className="py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Importar JSON
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
