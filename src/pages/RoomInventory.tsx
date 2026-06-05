import { useState, useEffect } from 'react';
import { Search, Package, Save, Plus, CheckCircle } from 'lucide-react';
import { supabase, Student, RoomInventory } from '../lib/supabase';
import { PAVILIONS } from '../lib/constants';

const INVENTORY_FIELDS: { key: keyof RoomInventory; label: string; default: number }[] = [
  { key: 'matelas', label: 'مرتبة', default: 1 },
  { key: 'couverture', label: 'بطانية', default: 1 },
  { key: 'drap', label: 'ملاءة', default: 2 },
  { key: 'oreiller', label: 'وسادة', default: 1 },
  { key: 'taie_oreiller', label: 'غيار وسادة', default: 1 },
  { key: 'chaise', label: 'كرسي', default: 1 },
  { key: 'bureau', label: 'مكتب', default: 1 },
  { key: 'armoire', label: 'خزانة', default: 1 },
];

interface InventoryWithStudent extends RoomInventory {
  student_nom: string;
}

export default function RoomInventoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [inventory, setInventory] = useState<InventoryWithStudent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editData, setEditData] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [dateEntree, setDateEntree] = useState('');
  const [dateSortie, setDateSortie] = useState('');

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('students').select('*').ilike('nom', `%${query}%`).limit(10);
    setResults(data || []);
    setLoading(false);
  }

  async function loadInventory(student: Student) {
    setSelected(student);
    setSaved(false);
    const { data } = await supabase.from('room_inventory').select('*').eq('student_id', student.id).maybeSingle();
    if (data) {
      const inv = data as InventoryWithStudent;
      inv.student_nom = student.nom;
      setInventory(inv);
      setEditData({
        matelas: inv.matelas,
        couverture: inv.couverture,
        drap: inv.drap,
        oreiller: inv.oreiller,
        taie_oreiller: inv.taie_oreiller,
        chaise: inv.chaise,
        bureau: inv.bureau,
        armoire: inv.armoire,
      });
      setNotes(inv.notes || '');
      setDateEntree(inv.date_entree || '');
      setDateSortie(inv.date_sortie || '');
    } else {
      setInventory(null);
      const defaults: Record<string, number> = {};
      INVENTORY_FIELDS.forEach(f => { defaults[f.key] = f.default; });
      setEditData(defaults);
      setNotes('');
      setDateEntree('');
      setDateSortie('');
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setSaved(false);

    const record = {
      student_id: selected.id,
      pavillon: selected.pavillon || '',
      chambre: selected.chambre || '',
      matelas: editData.matelas ?? 1,
      couverture: editData.couverture ?? 1,
      drap: editData.drap ?? 2,
      oreiller: editData.oreiller ?? 1,
      taie_oreiller: editData.taie_oreiller ?? 1,
      chaise: editData.chaise ?? 1,
      bureau: editData.bureau ?? 1,
      armoire: editData.armoire ?? 1,
      notes,
      date_entree: dateEntree || null,
      date_sortie: dateSortie || null,
      updated_at: new Date().toISOString(),
    };

    if (inventory) {
      await supabase.from('room_inventory').update(record).eq('id', inventory.id);
    } else {
      await supabase.from('room_inventory').insert(record);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-500" />بطاقة جرد مفروشات الغرفة
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="أدخل اسم الطالب للبحث..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button onClick={search} disabled={loading} className="px-4 py-2.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" />بحث
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {results.map(s => (
              <li key={s.id}>
                <button
                  className={`w-full text-right px-4 py-3 text-sm hover:bg-amber-50 transition-colors flex justify-between items-center ${selected?.id === s.id ? 'bg-amber-50 font-semibold' : ''}`}
                  onClick={() => loadInventory(s)}
                >
                  <span className="text-slate-800">{s.nom}</span>
                  <span className="text-slate-400 text-xs">{s.pavillon} / {s.chambre || '—'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800">{selected.nom}</h4>
              <p className="text-xs text-slate-400">{selected.pavillon} — غرفة {selected.chambre || '—'}</p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'تم الحفظ' : 'حفظ'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {INVENTORY_FIELDS.map(field => (
              <div key={field.key} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <label className="text-xs text-slate-500 block mb-1">{field.label}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditData(d => ({ ...d, [field.key]: Math.max(0, (d[field.key] ?? field.default) - 1) }))}
                    className="w-7 h-7 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 text-sm font-bold"
                  >−</button>
                  <span className="w-8 text-center font-bold text-slate-800 text-sm">{editData[field.key] ?? field.default}</span>
                  <button
                    onClick={() => setEditData(d => ({ ...d, [field.key]: (d[field.key] ?? field.default) + 1 }))}
                    className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200 text-sm font-bold"
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">تاريخ الدخول</label>
              <input
                type="date"
                value={dateEntree}
                onChange={e => setDateEntree(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">تاريخ الخروج</label>
              <input
                type="date"
                value={dateSortie}
                onChange={e => setDateSortie(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">ملاحظات</label>
              <input
                type="text"
                placeholder="ملاحظات إضافية..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {!selected && results.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col items-center justify-center py-16 text-slate-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">ابحث عن الطالب لإدارة جرد مفروشات الغرفة</p>
        </div>
      )}
    </div>
  );
}
