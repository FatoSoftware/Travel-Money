import React, { useState } from 'react';
import { Category, Expense } from '../types';
import { CategoryIcon, AVAILABLE_ICON_NAMES } from './CategoryIcon';
import { PARTICIPANT_COLORS } from '../data/initialData';
import { Layers, Plus, Edit2, Trash2, Check, X, Tag } from 'lucide-react';

interface CategoriesManagerProps {
  categories: Category[];
  expenses: Expense[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  expenses,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState(PARTICIPANT_COLORS[0]);

  const handleOpenAdd = () => {
    setName('');
    setIcon('Utensils');
    setColor(PARTICIPANT_COLORS[Math.floor(Math.random() * PARTICIPANT_COLORS.length)]);
    setEditingCategory(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setIcon(c.icon || 'Tag');
    setColor(c.color || PARTICIPANT_COLORS[0]);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: name.trim(),
        icon: icon,
        color: color,
      });
    } else {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        icon: icon,
        color: color,
      };
      onAddCategory(newCategory);
    }

    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    onDeleteCategory(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-indigo-950 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Categorías de Gastos ({categories.length})
          </h3>
          <p className="text-xs text-slate-500">Personaliza los iconos y colores</p>
        </div>

        {!isAdding && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-3xl bg-white border border-indigo-100 shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-indigo-950">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
              Nombre de la categoría <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Excursiones, Farmacia, Souvenirs..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Icono representativo
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              {AVAILABLE_ICON_NAMES.map((icName) => (
                <button
                  type="button"
                  key={icName}
                  onClick={() => setIcon(icName)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    icon === icName
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 scale-110 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title={icName}
                >
                  <CategoryIcon name={icName} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Color del icono
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
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md shadow-rose-200 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {categories.map((cat) => {
          const expenseCount = expenses.filter((e) => e.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="bg-white border border-indigo-100 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">{cat.name}</h4>
                  <span className="text-[11px] text-slate-400">
                    {expenseCount} {expenseCount === 1 ? 'gasto registrado' : 'gastos registrados'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCategoryToDelete(cat)}
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

      {/* In-App Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white border border-rose-100 text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-base text-slate-900">¿Eliminar categoría?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Deseas eliminar la categoría <strong className="text-slate-900">"{categoryToDelete.name}"</strong>?
              </p>
              {expenses.some((e) => e.categoryId === categoryToDelete.id) && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                  ⚠️ Esta categoría tiene gastos asignados.
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
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
