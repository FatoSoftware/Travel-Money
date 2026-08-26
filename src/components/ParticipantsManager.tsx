import React, { useState } from 'react';
import { Trip, Participant, Expense } from '../types';
import { PARTICIPANT_COLORS } from '../data/initialData';
import { Users, Plus, Edit2, Trash2, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface ParticipantsManagerProps {
  trip: Trip;
  participants: Participant[];
  expenses: Expense[];
  onAddParticipant: (participant: Participant) => void;
  onUpdateParticipant: (participant: Participant) => void;
  onDeleteParticipant: (participantId: string) => void;
}

const EMOJI_OPTIONS = ['👨🏻', '👩🏻', '🧔🏻', '👱🏼‍♀️', '👩🏽', '👨🏻‍🦱', '👩🏻‍🦰', '🧑🏻', '🤠', '😎', '🐶', '🐱', '🦊', '🦁', '🐼'];

export const ParticipantsManager: React.FC<ParticipantsManagerProps> = ({
  trip,
  participants,
  expenses,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
}) => {
  const tripParticipants = participants.filter((p) => p.tripId === trip.id);
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);

  const [isAdding, setIsAdding] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [color, setColor] = useState(PARTICIPANT_COLORS[0]);
  const [weight, setWeight] = useState(1);

  const handleOpenAdd = () => {
    setName('');
    setAvatar(EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)]);
    setColor(PARTICIPANT_COLORS[tripParticipants.length % PARTICIPANT_COLORS.length]);
    setWeight(1);
    setEditingParticipant(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setName(p.name);
    setAvatar(p.avatar || '👤');
    setColor(p.color || PARTICIPANT_COLORS[0]);
    setWeight(p.weight || 1);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    if (editingParticipant) {
      onUpdateParticipant({
        ...editingParticipant,
        name: name.trim(),
        avatar: avatar || '👤',
        color: color,
        weight: weight || 1,
      });
    } else {
      const newParticipant: Participant = {
        id: `part-${Date.now()}`,
        tripId: trip.id,
        name: name.trim(),
        avatar: avatar || '👤',
        color: color,
        weight: weight || 1,
      };
      onAddParticipant(newParticipant);
    }

    setIsAdding(false);
    setEditingParticipant(null);
  };

  const handleConfirmDelete = () => {
    if (!participantToDelete) return;
    onDeleteParticipant(participantToDelete.id);
    setParticipantToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-indigo-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Participantes del Viaje ({tripParticipants.length})
          </h3>
          <p className="text-xs text-slate-500">Viaje activo: {trip.name}</p>
        </div>

        {!isAdding && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Añadir</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Box */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-3xl bg-white border border-indigo-100 shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-indigo-950">
              {editingParticipant ? 'Editar Participante' : 'Nuevo Participante'}
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre de la persona <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Laura, Carlos, Marcos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Emoji Avatar Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Icono / Avatar
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((emo) => (
                <button
                  type="button"
                  key={emo}
                  onClick={() => setAvatar(emo)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
                    avatar === emo
                      ? 'bg-indigo-100 ring-2 ring-indigo-600 scale-110'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Color identificativo
            </label>
            <div className="flex flex-wrap gap-2">
              {PARTICIPANT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-indigo-600 scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingParticipant ? 'Guardar Cambios' : 'Añadir Participante'}
            </button>
          </div>
        </form>
      )}

      {/* Participants List */}
      <div className="space-y-2">
        {tripParticipants.map((p) => {
          const userExpensesCount = tripExpenses.filter((e) => e.paidById === p.id).length;

          return (
            <div
              key={p.id}
              className="bg-white border border-indigo-100 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs shrink-0"
                  style={{ backgroundColor: `${p.color}20`, border: `2px solid ${p.color}` }}
                >
                  {p.avatar || '👤'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">{p.name}</h4>
                  <span className="text-[11px] text-slate-400">
                    {userExpensesCount} {userExpensesCount === 1 ? 'gasto pagado' : 'gastos pagados'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setParticipantToDelete(p)}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all active:scale-95"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Delete Participant Confirmation Modal */}
      {participantToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white border border-rose-100 text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-base text-slate-900">¿Eliminar participante?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Deseas eliminar a <strong className="text-slate-900">"{participantToDelete.name}"</strong> de este viaje?
              </p>
              {tripExpenses.some((e) => e.paidById === participantToDelete.id) && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                  ⚠️ Este participante tiene gastos pagados registrados.
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-100 active:scale-95 transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
