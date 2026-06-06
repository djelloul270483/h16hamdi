import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ChevronDown, User, Eye, X, Download, Loader2 } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { PAVILIONS } from '../lib/constants';
import { exportStudentsToExcel } from '../lib/exportExcel';

const PAGE_SIZE = 50;

const PAV_COLOR_MAP: Record<string, string> = {};
PAVILIONS.forEach(p => { PAV_COLOR_MAP[p.id] = p.color; });

function getPavColor(pavillon: string | null): string {
  if (!pavillon) return '#94a38b';
  const id = pavillon.replace('PAV ', '').trim();
  return PAV_COLOR_MAP[id] || '#94a38b';
}

interface FiltersState {
  search: string;
  pavillon: string;
  nationalite: string;
  niveau: string;
  paiement: string;
  sexe: string;
}

function Badge({ value, trueLabel = 'نعم', falseLabel = 'لا' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function StudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const pavColor = getPavColor(student.pavillon);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-white p-5 rounded-t-2xl flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${pavColor}, ${pavColor}dd)` }}>
          <div>
            <h2 className="text-lg font-bold">{student.nom}</h2>
            <p className="text-sm opacity-80">{student.numero_inscription}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-sm" dir="rtl">
          {[
            ['رقم التعريف الوطني', student.nin],
            ['رقم بكالوريا', student.matricule_bac],
            ['تاريخ الميلاد', student.date_naissance],
            ['مكان الميلاد', student.lieu_naissance],
            ['الجنس', student.sexe === 'Garçon' ? 'ذكر' : 'أنثى'],
            ['الجنسية', student.nationalite],
            ['المؤسسة', student.etablissement],
            ['الميدان', student.domaine],
            ['التخصص', student.filiere],
            ['المستوى', student.niveau],
            ['الجناح', student.pavillon],
            ['رقم الغرفة', student.chambre],
            ['الولاية', student.wilaya_bac],
          ].map(([label, value]) => value ? (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-700">{value}</span>
            </div>
          ) : null)}
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">تسديد مستحقات الإيواء</span>
            <Badge value={student.paiement_hebergement} trueLabel="مسدد" falseLabel="غير مسدد" />
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">تسليم المفتاح</span>
            <Badge value={student.cle_remise} trueLabel="سُلّم" falseLabel="لم يُسلّم" />
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500">رسوم التسجيل</span>
            <Badge value={student.frais_inscription_paye} trueLabel="مدفوعة" falseLabel="غير مدفوعة" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({ search: '', pavillon: '', nationalite: '', niveau: '', paiement: '', sexe: '' });
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('students').select('*', { count: 'exact' });
      if (filters.search) query = query.ilike('nom', `%${filters.search}%`);
      if (filters.pavillon) query = query.ilike('pavillon', `%${filters.pavillon}%`);
      if (filters.nationalite) query = query.eq('nationalite', filters.nationalite);
      if (filters.niveau) query = query.eq('niveau', filters.niveau);
      if (filters.paiement === 'oui') query = query.eq('paiement_hebergement', true);
      else if (filters.paiement === 'non') query = query.eq('paiement_hebergement', false);
      if (filters.sexe) query = query.eq('sexe', filters.sexe);
      const { data, count, error } = await query.order('nom').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (!error && data) { setStudents(data); setTotal(count || 0); }
    } catch { /* network error - keep existing data */ }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    supabase.from('students').select('nationalite').then(({ data }) => {
      if (data) setNationalities([...new Set(data.map(d => d.nationalite).filter(Boolean) as string[])].sort());
    });
    supabase.from('students').select('niveau').then(({ data }) => {
      if (data) setLevels([...new Set(data.map(d => d.niveau).filter(Boolean) as string[])].sort());
    });
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportStudentsToExcel(filters);
    } catch (e) {
      console.error('Export failed:', e);
      alert('فشل التصدير. حاول مرة أخرى.');
    } finally {
      setExporting(false);
    }
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
            <input type="text" placeholder="البحث باسم الطالب..." value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(0); }} className="w-full pr-9 pl-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" dir="rtl" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-colors ${showFilters ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-4 h-4" />فلترة<ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ التصدير...</>
              : <><Download className="w-4 h-4" />تصدير Excel</>}
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t border-slate-100">
            <select value={filters.pavillon} onChange={e => { setFilters(f => ({ ...f, pavillon: e.target.value })); setPage(0); }} className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">كل الأجنحة</option>
              {PAVILIONS.map(p => <option key={p.id} value={p.label}>{p.name}</option>)}
            </select>
            <select value={filters.nationalite} onChange={e => { setFilters(f => ({ ...f, nationalite: e.target.value })); setPage(0); }} className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">كل الجنسيات</option>
              {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filters.niveau} onChange={e => { setFilters(f => ({ ...f, niveau: e.target.value })); setPage(0); }} className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">كل المستويات</option>
              {levels.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filters.paiement} onChange={e => { setFilters(f => ({ ...f, paiement: e.target.value })); setPage(0); }} className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">حالة الدفع</option><option value="oui">سدد</option><option value="non">لم يسدد</option>
            </select>
            <select value={filters.sexe} onChange={e => { setFilters(f => ({ ...f, sexe: e.target.value })); setPage(0); }} className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">الجنس</option><option value="Garçon">ذكر</option><option value="Fille">أنثى</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{total.toLocaleString('fr-DZ')} طالب</span>
        <span>صفحة {page + 1} من {totalPages || 1}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
        : students.length === 0 ? <div className="flex flex-col items-center justify-center h-48 text-slate-400"><User className="w-10 h-10 mb-2 opacity-40" /><p>لا توجد نتائج</p></div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="bg-gradient-to-l from-amber-50 to-amber-50/50 border-b border-amber-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">#</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">الاسم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">رقم البكالوريا</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">الجنسية</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">الجناح / الغرفة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">المستوى</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">الإيواء</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700">المفتاح</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const pavColor = getPavColor(s.pavillon);
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{page * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-3"><div className="font-medium text-slate-800">{s.nom}</div><div className="text-xs text-slate-400">{s.numero_inscription}</div></td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-mono">{s.matricule_bac || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{s.nationalite || '—'}</td>
                      <td className="px-4 py-3">
                        {s.pavillon ? (
                          <span className="pav-badge text-[10px]" style={{ backgroundColor: pavColor }}>
                            {s.pavillon.replace('PAV ', 'P')}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                        {s.chambre && <span className="text-slate-500 text-xs mr-1.5">/ {String(parseInt(s.chambre.replace(/^.*[-_]/, ''), 10) || s.chambre)}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{s.niveau || '—'}</td>
                      <td className="px-4 py-3"><Badge value={s.paiement_hebergement} trueLabel="مسدد" falseLabel="لا" /></td>
                      <td className="px-4 py-3"><Badge value={s.cle_remise} trueLabel="سُلّم" falseLabel="لا" /></td>
                      <td className="px-4 py-3"><button onClick={() => setSelected(s)} className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"><Eye className="w-4 h-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 text-sm rounded-lg border border-amber-200 disabled:opacity-40 hover:bg-amber-50 text-amber-700">السابق</button>
          <span className="px-4 py-2 text-sm text-slate-600">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-4 py-2 text-sm rounded-lg border border-amber-200 disabled:opacity-40 hover:bg-amber-50 text-amber-700">التالي</button>
        </div>
      )}

      {selected && <StudentModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
