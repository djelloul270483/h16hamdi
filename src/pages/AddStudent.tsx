import { useState, useEffect } from 'react';
import {
  UserPlus, Save, CheckCircle, Loader2, X, AlertCircle,
  Globe, Info, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PAVILIONS } from '../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  // identity
  nom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  nationalite: string;
  // housing
  pavillon: string;
  chambre: string;
  residence: string;
  // academic
  numero_inscription: string;
  etablissement: string;
  domaine: string;
  filiere: string;
  niveau: string;
  commune: string;
  // status
  paiement_hebergement: boolean;
  cle_remise: boolean;
  frais_inscription_paye: boolean;
  // foreign student identifiers
  nin: string;
  matricule_bac: string;
  annee_bac: string;
  wilaya_bac: string;
};

const EMPTY: FormData = {
  nom: '',
  date_naissance: '',
  lieu_naissance: '',
  sexe: 'Garçon',
  nationalite: '',
  pavillon: '',
  chambre: '',
  residence: 'الإقامة الجامعية عين الباي 16',
  numero_inscription: '',
  etablissement: '',
  domaine: '',
  filiere: '',
  niveau: '',
  commune: '',
  paiement_hebergement: false,
  cle_remise: false,
  frais_inscription_paye: false,
  nin: '',
  matricule_bac: '',
  annee_bac: '',
  wilaya_bac: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoomsForPavilion(pavLabel: string): string[] {
  const pav = PAVILIONS.find(p => p.label === pavLabel);
  if (!pav) return [];
  const rooms: string[] = [];
  for (const floor of pav.floors) {
    for (let r = floor.start; r <= floor.end; r++) {
      rooms.push(`${floor.prefix}${String(r).padStart(2, '0')}`);
    }
  }
  return rooms;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'right-1' : 'right-6'}`} />
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', options, required, placeholder, hint
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'select' | 'number';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const base = 'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow';
  const borderCls = required && !value ? 'border-red-200 bg-red-50/30' : 'border-slate-200';

  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">
        {label}{required && <span className="text-red-400 mr-0.5">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${base} ${borderCls}`}
        >
          <option value="">— اختر —</option>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} ${borderCls}`}
        />
      )}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Success Card ─────────────────────────────────────────────────────────────
function SuccessCard({ name, room, pavillon, onAddAnother }: {
  name: string; room: string; pavillon: string; onAddAnother: () => void;
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3 animate-pulse-once">
      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
      <div>
        <p className="font-bold text-emerald-800 text-lg">{name}</p>
        <p className="text-sm text-emerald-600 mt-1">
          تم الإضافة بنجاح — {pavillon} / غرفة {room}
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium">
        <Globe className="w-3.5 h-3.5" />
        طالب أجنبي — غير مسجل في البروقرس
      </div>
      <button
        onClick={onAddAnother}
        className="flex items-center gap-2 mx-auto px-5 py-2 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 transition-colors"
      >
        <UserPlus className="w-4 h-4" />إضافة طالب آخر
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddStudent() {
  const [form, setForm] = useState<FormData>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; room: string; pavillon: string } | null>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [rooms, setRooms] = useState<string[]>([]);
  const [existingEstab, setExistingEstab] = useState<string[]>([]);
  const [existingNiveaux, setExistingNiveaux] = useState<string[]>([]);
  const [existingDomaines, setExistingDomaines] = useState<string[]>([]);

  // Load existing values for autocomplete selects
  useEffect(() => {
    supabase.from('students')
      .select('etablissement, niveau, domaine')
      .then(({ data }) => {
        if (!data) return;
        setExistingEstab([...new Set(data.map(d => d.etablissement).filter(Boolean) as string[])].sort());
        setExistingNiveaux([...new Set(data.map(d => d.niveau).filter(Boolean) as string[])].sort());
        setExistingDomaines([...new Set(data.map(d => d.domaine).filter(Boolean) as string[])].sort());
      });
  }, []);

  // Update room list when pavilion changes
  useEffect(() => {
    if (form.pavillon) {
      setRooms(getRoomsForPavilion(form.pavillon));
      setForm(f => ({ ...f, chambre: '' }));
    } else {
      setRooms([]);
    }
  }, [form.pavillon]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setError(null);
  }

  function validate(): string | null {
    if (!form.nom.trim()) return 'الاسم الكامل مطلوب';
    if (!form.nationalite.trim()) return 'الجنسية مطلوبة';
    if (!form.pavillon) return 'يجب اختيار الجناح';
    if (!form.chambre) return 'يجب اختيار رقم الغرفة';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError(null);

    // Build the record. We mark foreign/manual students with a special prefix
    // in `numero_inscription` so they are easily identifiable as "not in Progress".
    const record = {
      nom: form.nom.trim().toUpperCase(),
      date_naissance: form.date_naissance || null,
      lieu_naissance: form.lieu_naissance.trim(),
      sexe: form.sexe,
      nationalite: form.nationalite.trim(),
      pavillon: form.pavillon,
      chambre: form.chambre,
      residence: form.residence,
      numero_inscription: form.numero_inscription.trim() || `HORS-PROGRESS-${Date.now()}`,
      etablissement: form.etablissement.trim(),
      domaine: form.domaine.trim(),
      filiere: form.filiere.trim(),
      niveau: form.niveau,
      commune: form.commune.trim(),
      paiement_hebergement: form.paiement_hebergement,
      cle_remise: form.cle_remise,
      frais_inscription_paye: form.frais_inscription_paye,
      nin: form.nin.trim() || null,
      matricule_bac: form.matricule_bac.trim() || null,
      annee_bac: form.annee_bac ? parseInt(form.annee_bac) : null,
      wilaya_bac: form.wilaya_bac.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error: dbErr } = await supabase.from('students').insert(record);
    setSaving(false);

    if (dbErr) {
      setError(`خطأ في قاعدة البيانات: ${dbErr.message}`);
      return;
    }

    setSuccess({ name: record.nom, room: record.chambre, pavillon: record.pavillon });
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto p-4 mt-6">
        <SuccessCard
          {...success}
          onAddAnother={() => { setSuccess(null); setForm({ ...EMPTY }); }}
        />
      </div>
    );
  }

  const pavOptions = PAVILIONS.map(p => p.label);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4" dir="rtl">

      {/* Header banner */}
      <div className="bg-gradient-to-l from-amber-500 to-amber-600 rounded-xl p-4 text-white flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg">إضافة طالب أجنبي يدوياً</h2>
          <p className="text-xs text-amber-100 mt-0.5">للطلاب غير الظاهرين في ملف البروقرس</p>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-sm text-sky-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-500" />
        <p>
          الطالب المضاف هنا سيظهر في كل الصفحات بنفس طريقة بقية الطلاب — مع علامة
          <span className="mx-1 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
            <Globe className="w-3 h-3" />أجنبي / خارج البروقرس
          </span>
          عند الحاجة.
        </p>
      </div>

      {/* ── Identity ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-amber-700 border-b border-amber-100 pb-2 mb-3">
          المعلومات الشخصية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="الاسم الكامل (باللاتينية)" value={form.nom}
            onChange={v => set('nom', v)} required
            placeholder="NOM Prénom"
          />
          <Field
            label="الجنسية" value={form.nationalite}
            onChange={v => set('nationalite', v)} required
            placeholder="Française / Tunisienne / ..."
          />
          <Field
            label="تاريخ الميلاد" value={form.date_naissance}
            onChange={v => set('date_naissance', v)} type="date"
          />
          <Field
            label="مكان الميلاد" value={form.lieu_naissance}
            onChange={v => set('lieu_naissance', v)}
            placeholder="Ville, Pays"
          />
          <Field
            label="الجنس" value={form.sexe}
            onChange={v => set('sexe', v)} type="select"
            options={['Garçon', 'Fille']}
          />
        </div>
      </section>

      {/* ── Housing ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-amber-700 border-b border-amber-100 pb-2 mb-3">
          الإقامة والغرفة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="الجناح" value={form.pavillon}
            onChange={v => set('pavillon', v)} type="select"
            options={pavOptions} required
          />
          <Field
            label="رقم الغرفة" value={form.chambre}
            onChange={v => set('chambre', v)} type="select"
            options={rooms} required
            hint={!form.pavillon ? 'اختر الجناح أولاً' : undefined}
          />
        </div>
      </section>

      {/* ── Academic ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-amber-700 border-b border-amber-100 pb-2 mb-3">
          المعلومات الأكاديمية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="رقم التسجيل" value={form.numero_inscription}
            onChange={v => set('numero_inscription', v)}
            placeholder="اتركه فارغاً إذا لم يكن موجوداً"
            hint="إذا كان فارغاً سيُوضع رمز تلقائي HORS-PROGRESS"
          />
          <Field
            label="المؤسسة" value={form.etablissement}
            onChange={v => set('etablissement', v)} type="select"
            options={existingEstab}
            placeholder="اسم المؤسسة"
          />
          <Field
            label="الميدان" value={form.domaine}
            onChange={v => set('domaine', v)} type="select"
            options={existingDomaines}
          />
          <Field
            label="التخصص / الفيلية" value={form.filiere}
            onChange={v => set('filiere', v)}
            placeholder="Spécialité"
          />
          <Field
            label="المستوى" value={form.niveau}
            onChange={v => set('niveau', v)} type="select"
            options={existingNiveaux}
          />
        </div>
      </section>

      {/* ── Status toggles ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <h3 className="text-xs font-bold text-amber-700 border-b border-amber-100 pb-2 mb-1">
          الحالات
        </h3>
        <Toggle label="تسديد مستحقات الإيواء" value={form.paiement_hebergement} onChange={v => set('paiement_hebergement', v)} />
        <Toggle label="تسليم المفتاح" value={form.cle_remise} onChange={v => set('cle_remise', v)} />
        <Toggle label="رسوم التسجيل مدفوعة" value={form.frais_inscription_paye} onChange={v => set('frais_inscription_paye', v)} />
      </section>

      {/* ── Extra identifiers (collapsible) ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowExtra(e => !e)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span>معلومات إضافية اختيارية (NIN، بكالوريا...)</span>
          {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showExtra && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <Field label="NIN" value={form.nin} onChange={v => set('nin', v)} placeholder="رقم التعريف الوطني" />
            <Field label="رقم بكالوريا" value={form.matricule_bac} onChange={v => set('matricule_bac', v)} />
            <Field label="سنة البكالوريا" value={form.annee_bac} onChange={v => set('annee_bac', v)} type="number" placeholder="2023" />
            <Field label="ولاية البكالوريا / Région" value={form.wilaya_bac} onChange={v => set('wilaya_bac', v)} />
            <Field label="البلدية / Commune" value={form.commune} onChange={v => set('commune', v)} />
          </div>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <button
          onClick={() => { setForm({ ...EMPTY }); setError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />مسح
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60 font-medium shadow-sm"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الإضافة...</>
            : <><Save className="w-4 h-4" />إضافة الطالب</>}
        </button>
      </div>
    </div>
  );
}
