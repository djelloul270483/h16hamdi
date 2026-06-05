import { useState } from 'react';
import { Search, User, MapPin, Hash, CreditCard, Key } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { PAVILIONS } from '../lib/constants';

const PAV_COLOR_MAP: Record<string, string> = {};
PAVILIONS.forEach(p => { PAV_COLOR_MAP[p.id] = p.color; });

function getPavColor(pavillon: string | null): string {
  if (!pavillon) return '#94a38b';
  const id = pavillon.replace('PAV ', '').trim();
  return PAV_COLOR_MAP[id] || '#94a38b';
}

export default function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const q = query.trim();

    const [byName, byRoom, byReg, byNin] = await Promise.all([
      supabase.from('students').select('*').ilike('nom', `%${q}%`).limit(20),
      supabase.from('students').select('*').ilike('chambre', `%${q}%`).limit(20),
      supabase.from('students').select('*').ilike('numero_inscription', `%${q}%`).limit(20),
      supabase.from('students').select('*').ilike('nin', `%${q}%`).limit(20),
    ]);

    const all = [...(byName.data || []), ...(byRoom.data || []), ...(byReg.data || []), ...(byNin.data || [])];
    const unique = new Map<string, Student>();
    all.forEach(s => unique.set(s.id, s));
    setResults([...unique.values()]);
    setLoading(false);
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-600" />بحث سريع
        </h3>
        <p className="text-xs text-slate-400 mb-3">ابحث بالاسم، رقم الغرفة، رقم التسجيل، أو رقم التعريف الوطني</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="أدخل كلمة البحث..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button onClick={search} disabled={loading} className="px-5 py-2.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50">
            <Search className="w-4 h-4" />بحث
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{results.length} نتيجة</p>
          {results.map(s => {
            const pavColor = getPavColor(s.pavillon);
            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${pavColor}15` }}>
                      <User className="w-5 h-5" style={{ color: pavColor }} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{s.nom}</p>
                      <p className="text-xs text-slate-400">{s.numero_inscription || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.paiement_hebergement ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                      {s.paiement_hebergement ? 'مسدد' : 'غير مسدد'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.cle_remise ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                      {s.cle_remise ? 'مفتاح سُلّم' : 'مفتاح لم يُسلّم'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" style={{ color: pavColor }} />
                    <span>{s.pavillon ? <span className="pav-badge text-[9px]" style={{ backgroundColor: pavColor }}>{s.pavillon.replace('PAV ', 'P')}</span> : '—'} / {s.chambre || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Hash className="w-3.5 h-3.5 text-amber-500" />
                    <span>{s.nationalite || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    <span>{s.etablissement || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>{s.niveau || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col items-center justify-center py-16 text-slate-400">
          <Search className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">لا توجد نتائج مطابقة</p>
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col items-center justify-center py-16 text-slate-400">
          <Search className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">أدخل كلمة البحث للعثور على طالب</p>
        </div>
      )}
    </div>
  );
}
