import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  WifiOff,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-indigo-100 text-slate-900 w-full max-w-md max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-indigo-950">Instalar en tu Móvil</h3>
              <p className="text-xs text-slate-500">Acceso rápido y funcionamiento 100% offline</p>
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
          {/* Offline & Fast Benefits */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <Zap className="w-4 h-4 text-amber-500 mx-auto" />
              <span className="text-[10px] font-bold uppercase text-slate-600 block">Carga Rápida</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <WifiOff className="w-4 h-4 text-emerald-600 mx-auto" />
              <span className="text-[10px] font-bold uppercase text-slate-600 block">Modo Offline</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600 mx-auto" />
              <span className="text-[10px] font-bold uppercase text-slate-600 block">100% Privado</span>
            </div>
          </div>

          {/* Platform Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setPlatform('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                platform === 'android'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>🤖 Android (Chrome)</span>
            </button>
            <button
              onClick={() => setPlatform('ios')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                platform === 'ios'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>🍎 iPhone / iPad (Safari)</span>
            </button>
          </div>

          {/* Android Steps */}
          {platform === 'android' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Abre la app en Google Chrome</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Pulsa el botón de <strong>3 puntos verticales (⋮)</strong> en la esquina superior derecha del navegador.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Selecciona "Instalar aplicación"</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      O la opción <strong>"Añadir a la pantalla de inicio"</strong> en el menú desplegable.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">¡Listo como app nativa!</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Aparecerá el icono de <strong>Travel Money</strong> en tu escritorio. Se abrirá a pantalla completa sin barras de navegador.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Steps */}
          {platform === 'ios' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Abre la app en Safari</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      En la barra inferior de Safari, pulsa el botón de <strong>Compartir <Share className="w-3.5 h-3.5 inline mx-1 text-indigo-600" /></strong> (el cuadrado con la flecha hacia arriba).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Elige "Añadir a pantalla de inicio"</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Baja en la lista de opciones y toca en <strong>"Añadir a la pantalla de inicio" <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-600" /></strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Confirma y añade</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Toca "Añadir" arriba a la derecha. La app se guardará con icono independiente en tu iPhone/iPad y funcionará sin conexión.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
