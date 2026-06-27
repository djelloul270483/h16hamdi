import { useState, useRef } from 'react';
import { Search, Package, Save, Printer, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, Student, RoomInventory } from '../lib/supabase';
import { getYear } from '../lib/constants';

const INVENTORY_ITEMS: { key: keyof RoomInventory; fr: string; ar: string; default: number }[] = [
  { key: 'lit',              fr: 'LIT',              ar: 'سرير',           default: 1 },
  { key: 'matelas',          fr: 'MATELAS',          ar: 'مرتبة',           default: 1 },
  { key: 'couvre_matelas',   fr: 'COUVRE MATELAS',   ar: 'غطاء المرتبة',   default: 1 },
  { key: 'couverture',       fr: 'COUVERTURE',       ar: 'بطانية',          default: 1 },
  { key: 'drap',             fr: 'DRAP',             ar: 'ملاءة',           default: 2 },
  { key: 'traversin',        fr: 'TRAVERSIN',        ar: 'وسادة اسطوانية', default: 1 },
  { key: 'couvre_traversin', fr: 'COUVRE TRAVERSIN', ar: 'غيار الوسادة',   default: 1 },
  { key: 'table_etude',      fr: 'TABLE ETUDE',      ar: 'طاولة الدراسة',  default: 1 },
  { key: 'chaise',           fr: 'CHAISE',           ar: 'كرسي',            default: 1 },
  { key: 'lampe',            fr: 'LAMPE',            ar: 'مصباح',           default: 1 },
  { key: 'vachette',         fr: 'VACHETTE',         ar: 'حقيبة',           default: 1 },
  { key: 'clef',             fr: 'CLEF',             ar: 'مفتاح',           default: 1 },
  { key: 'plateau',          fr: 'PLATEAU',          ar: 'صينية',           default: 1 },
];

const OBS_KEYS: Record<string, string> = {
  lit: 'obs_lit', matelas: 'obs_matelas', couvre_matelas: 'obs_couvre_matelas',
  couverture: 'obs_couverture', drap: 'obs_drap', traversin: 'obs_traversin',
  couvre_traversin: 'obs_couvre_traversin', table_etude: 'obs_table_etude',
  chaise: 'obs_chaise', lampe: 'obs_lampe', vachette: 'obs_vachette',
  clef: 'obs_clef', plateau: 'obs_plateau',
};

function buildDefaults(): Record<string, number | string> {
  const d: Record<string, number | string> = {};
  INVENTORY_ITEMS.forEach(f => { d[f.key] = f.default; d[OBS_KEYS[f.key]] = ''; });
  d.visa_blanchisserie_entree = '';
  d.visa_service_entree = '';
  d.visa_blanchisserie_sortie = '';
  d.visa_service_sortie = '';
  d.mouchoir_visage = 1;
  d.annee = getYear();
  d.date_entree = '';
  d.date_sortie = '';
  return d;
}

interface PrintCardProps { student: Student; data: Record<string, number | string>; side: 'front' | 'back'; }

function PrintCard({ student, data, side }: PrintCardProps) {
  const parts = student.nom.split(' ');
  const nom = parts[0] || student.nom;
  const prenom = parts.slice(1).join(' ');
  const cardStyle: React.CSSProperties = { width: '190mm', height: '130mm', border: '1.5px solid #666', padding: '5mm 7mm', fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', background: '#fff', boxSizing: 'border-box', overflow: 'hidden' };
  const thStyle: React.CSSProperties = { border: '1px solid #666', padding: '2mm 3mm', textAlign: 'center', background: '#e8e8e8' };
  const tdStyle: React.CSSProperties = { border: '1px solid #999', padding: '1.5mm 3mm' };

  if (side === 'front') return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', textDecoration: 'underline', marginBottom: '4mm', letterSpacing: '1px' }}>SERVICE HEBERGEMENT</div>
      <div style={{ display: 'flex', gap: '10mm', marginBottom: '2mm' }}>
        <span><b>FICHE INVENTAIRE N°</b> ............</span>
        <span><b>ANNEE</b> {String(data.annee || getYear())}</span>
      </div>
      <div style={{ display: 'flex', gap: '10mm', marginBottom: '2mm' }}>
        <span><b>NOM :</b> {nom}</span>
        <span><b>PRENOM :</b> {prenom || '—'}</span>
      </div>
      <div style={{ display: 'flex', gap: '10mm', marginBottom: '2mm' }}>
        <span><b>PAVILLON :</b> {student.pavillon || '—'}</span>
        <span><b>CHAMBRE :</b> {student.chambre || '—'}</span>
      </div>
      <div style={{ display: 'flex', gap: '10mm', marginBottom: '3mm', fontSize: '9pt' }}>
        <span><b>تاريخ الدخول :</b> {String(data.date_entree || '............')}</span>
        <span><b>تاريخ الخروج :</b> {String(data.date_sortie || '............')}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
        <thead><tr>
          <th style={{ ...thStyle, width: '50%', textAlign: 'center' }}>DESIGNATION</th>
          <th style={{ ...thStyle, width: '20%' }}>NOMBRE</th>
          <th style={{ ...thStyle, width: '30%' }}>OBSERVATION</th>
        </tr></thead>
        <tbody>
          {INVENTORY_ITEMS.map(item => (
            <tr key={item.key}>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>{item.fr}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{data[item.key]}</td>
              <td style={{ ...tdStyle, fontSize: '8pt' }}>{data[OBS_KEYS[item.key]]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5mm', fontSize: '9pt' }}>
        <div style={{ textAlign: 'center' }}><b>L'ETUDIANT</b><div style={{ marginTop: '10mm', borderTop: '1px solid #888', width: '55mm' }} /></div>
        <div style={{ textAlign: 'center' }}><b>CHEF DE SERVICE</b><div style={{ marginTop: '10mm', borderTop: '1px solid #888', width: '55mm' }} /></div>
      </div>
    </div>
  );

  // Back side
  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', textDecoration: 'underline', marginBottom: '4mm' }}>
        SERVICE HEBERGEMENT — {student.nom}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '36%' }}>البيان</th>
            <th style={{ ...thStyle, width: '32%' }}>عند الدخول</th>
            <th style={{ ...thStyle, width: '32%' }}>عند الخروج</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 'bold' }}>تأشيرة البياضة</td>
            <td style={{ ...tdStyle, height: '18mm', verticalAlign: 'top', fontSize: '8pt' }}>{String(data.visa_blanchisserie_entree || '')}</td>
            <td style={{ ...tdStyle, height: '18mm', verticalAlign: 'top', fontSize: '8pt' }}>{String(data.visa_blanchisserie_sortie || '')}</td>
          </tr>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 'bold' }}>تأشيرة مصلحة الإيواء</td>
            <td style={{ ...tdStyle, height: '18mm', verticalAlign: 'top', fontSize: '8pt' }}>{String(data.visa_service_entree || '')}</td>
            <td style={{ ...tdStyle, height: '18mm', verticalAlign: 'top', fontSize: '8pt' }}>{String(data.visa_service_sortie || '')}</td>
          </tr>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 'bold' }}>ماسح الوجه</td>
            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{data.mouchoir_visage}</td>
            <td style={tdStyle}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '5mm', fontSize: '9pt', borderTop: '1px solid #ccc', paddingTop: '3mm', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4mm' }}>
        <span><b>الجناح:</b> {student.pavillon || '—'}</span>
        <span><b>الغرفة:</b> {student.chambre || '—'}</span>
        <span><b>تاريخ الدخول:</b> {String(data.date_entree || '—')}</span>
        <span><b>تاريخ الخروج:</b> {String(data.date_sortie || '—')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7mm', fontSize: '9pt' }}>
        <div style={{ textAlign: 'center' }}><b>الطالب</b><div style={{ marginTop: '10mm', borderTop: '1px solid #888', width: '55mm' }} /></div>
        <div style={{ textAlign: 'center' }}><b>رئيس المصلحة</b><div style={{ marginTop: '10mm', borderTop: '1px solid #888', width: '55mm' }} /></div>
      </div>
    </div>
  );
}

export default function RoomInventoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editData, setEditData] = useState<Record<string, number | string>>(buildDefaults());
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const printRef = useRef<HTMLDivElement>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('students').select('*').ilike('nom', `%${query}%`).limit(10);
    setResults(data || []);
    setLoading(false);
  }

  async function loadInventory(student: Student) {
    setSelected(student); setSaved(false); setPreviewSide('front');
    const { data } = await supabase.from('room_inventory').select('*').eq('student_id', student.id).maybeSingle();
    const d = buildDefaults();
    if (data) {
      setInventoryId(data.id);
      INVENTORY_ITEMS.forEach(item => {
        if (data[item.key] != null) d[item.key] = data[item.key];
        const ok = OBS_KEYS[item.key];
        if (data[ok] != null) d[ok] = data[ok];
      });
      if (data.visa_blanchisserie_entree != null) d.visa_blanchisserie_entree = data.visa_blanchisserie_entree;
      else if (data.visa_blanchisserie) d.visa_blanchisserie_entree = data.visa_blanchisserie; // legacy
      if (data.visa_service_entree != null) d.visa_service_entree = data.visa_service_entree;
      else if (data.visa_service) d.visa_service_entree = data.visa_service; // legacy
      if (data.visa_blanchisserie_sortie != null) d.visa_blanchisserie_sortie = data.visa_blanchisserie_sortie;
      if (data.visa_service_sortie != null) d.visa_service_sortie = data.visa_service_sortie;
      if (data.mouchoir_visage != null) d.mouchoir_visage = data.mouchoir_visage;
      if (data.annee) d.annee = data.annee;
      if (data.date_entree) d.date_entree = data.date_entree;
      if (data.date_sortie) d.date_sortie = data.date_sortie;
    } else { setInventoryId(null); }
    setEditData(d);
  }

  async function save() {
    if (!selected) return;
    setSaving(true); setSaved(false);
    const record: Record<string, string | number | null> = {
      student_id: selected.id, pavillon: selected.pavillon || '', chambre: selected.chambre || '',
      updated_at: new Date().toISOString(),
    };
    INVENTORY_ITEMS.forEach(item => {
      record[item.key] = Number(editData[item.key]) || item.default;
      record[OBS_KEYS[item.key]] = String(editData[OBS_KEYS[item.key]] || '');
    });
    record.visa_blanchisserie_entree = String(editData.visa_blanchisserie_entree || '');
    record.visa_service_entree       = String(editData.visa_service_entree || '');
    record.visa_blanchisserie_sortie = String(editData.visa_blanchisserie_sortie || '');
    record.visa_service_sortie       = String(editData.visa_service_sortie || '');
    // keep legacy fields as alias of entree for backward compat
    record.visa_blanchisserie = record.visa_blanchisserie_entree;
    record.visa_service       = record.visa_service_entree;
    record.mouchoir_visage = Number(editData.mouchoir_visage) || 1;
    record.annee = String(editData.annee || getYear());
    record.date_entree = editData.date_entree ? String(editData.date_entree) : null;
    record.date_sortie = editData.date_sortie ? String(editData.date_sortie) : null;
    if (inventoryId) {
      await supabase.from('room_inventory').update(record).eq('id', inventoryId);
    } else {
      const { data } = await supabase.from('room_inventory').insert(record).select('id').single();
      if (data) setInventoryId(data.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  function handlePrint() {
    const contents = printRef.current?.innerHTML;
    if (!contents) return;
    const win = window.open('', '', 'width=960,height=720');
    if (!win) return;
    win.document.write(`<html><head><title>بطاقة الجرد — \${selected?.nom}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        body { margin: 0; font-family: Arial, sans-serif; }
        table { border-collapse: collapse; }
        .cut-line {
          width: 190mm;
          border: none;
          border-top: 1.5px dashed #999;
          margin: 4mm 0;
          position: relative;
        }
        .cut-line::before {
          content: 'قطع هنا ✂';
          position: absolute;
          top: -8px;
          right: 50%;
          transform: translateX(50%);
          background: #fff;
          padding: 0 3mm;
          font-size: 7pt;
          color: #aaa;
          white-space: nowrap;
        }
      </style>
      </head><body>\${contents}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  }

  function setNum(key: string, delta: number) {
    setEditData(d => ({ ...d, [key]: Math.max(0, Number(d[key] ?? 0) + delta) }));
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-500" />بطاقة جرد مفروشات الغرفة — FICHE INVENTAIRE
        </h3>
        <div className="flex gap-2">
          <input type="text" placeholder="أدخل اسم الطالب للبحث..." value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <button onClick={search} disabled={loading} className="px-4 py-2.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" />بحث
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {results.map(s => (
              <li key={s.id}>
                <button className={`w-full text-right px-4 py-3 text-sm hover:bg-amber-50 transition-colors flex justify-between items-center ${selected?.id === s.id ? 'bg-amber-50 font-semibold' : ''}`}
                  onClick={() => loadInventory(s)}>
                  <span className="text-slate-800">{s.nom}</span>
                  <span className="text-slate-400 text-xs">{s.pavillon} / {s.chambre || '—'} — {s.niveau}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-slate-800">{selected.nom}</h4>
              <p className="text-xs text-slate-400">{selected.pavillon} — غرفة {selected.chambre || '—'} — {selected.niveau}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50">
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}{saved ? 'تم الحفظ' : 'حفظ'}
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800">
                <Printer className="w-4 h-4" />طباعة
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0">السنة الجامعية:</label>
              <input type="text" value={editData.annee as string}
                onChange={e => setEditData(d => ({ ...d, annee: e.target.value }))}
                className="w-36 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>

          <h5 className="text-xs font-bold text-amber-700 mb-2 border-b border-amber-100 pb-1">الوجه (Recto) — محتويات الغرفة</h5>
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-amber-50">
                  <th className="border border-slate-200 px-2 py-2 text-right text-xs text-amber-700 w-6">#</th>
                  <th className="border border-slate-200 px-3 py-2 text-right text-xs text-amber-700">DESIGNATION</th>
                  <th className="border border-slate-200 px-3 py-2 text-center text-xs text-amber-700 w-28">NOMBRE</th>
                  <th className="border border-slate-200 px-3 py-2 text-center text-xs text-amber-700">OBSERVATION</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY_ITEMS.map((item, idx) => (
                  <tr key={item.key} className={idx % 2 === 0 ? '' : 'bg-slate-50/40'}>
                    <td className="border border-slate-200 px-2 py-1.5 text-xs text-slate-400 text-center">{idx + 1}</td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <div className="font-bold text-slate-700 text-xs">{item.fr}</div>
                      <div className="text-slate-400 text-xs">{item.ar}</div>
                    </td>
                    <td className="border border-slate-200 px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setNum(item.key, -1)} className="w-6 h-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 text-xs font-bold flex items-center justify-center">−</button>
                        <span className="w-7 text-center font-bold text-sm">{editData[item.key]}</span>
                        <button onClick={() => setNum(item.key, 1)} className="w-6 h-6 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-bold flex items-center justify-center">+</button>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-2 py-1">
                      <input type="text" value={editData[OBS_KEYS[item.key]] as string}
                        onChange={e => setEditData(d => ({ ...d, [OBS_KEYS[item.key]]: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-300"
                        placeholder="ملاحظة..." />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h5 className="text-xs font-bold text-slate-600 mb-2 border-b border-slate-100 pb-1">الظهر (Verso) — تأشيرات البياضة ومصلحة الإيواء وماسح الوجه</h5>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <label className="text-xs font-bold text-emerald-700 block mb-1">📅 تاريخ الدخول</label>
              <input type="date" value={editData.date_entree as string}
                onChange={e => setEditData(d => ({ ...d, date_entree: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
              <label className="text-xs font-bold text-rose-700 block mb-1">📅 تاريخ الخروج</label>
              <input type="date" value={editData.date_sortie as string}
                onChange={e => setEditData(d => ({ ...d, date_sortie: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-rose-200 rounded focus:outline-none focus:ring-1 focus:ring-rose-400" />
            </div>
          </div>

          {/* 2×2 visa grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
                ✅ عند الدخول
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50">
                <div className="p-3">
                  <label className="text-xs font-bold text-slate-600 block mb-1">تأشيرة البياضة</label>
                  <textarea value={editData.visa_blanchisserie_entree as string}
                    onChange={e => setEditData(d => ({ ...d, visa_blanchisserie_entree: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-emerald-300" rows={3}
                    placeholder="توقيع البياضة..." />
                </div>
                <div className="p-3">
                  <label className="text-xs font-bold text-slate-600 block mb-1">تأشيرة مصلحة الإيواء</label>
                  <textarea value={editData.visa_service_entree as string}
                    onChange={e => setEditData(d => ({ ...d, visa_service_entree: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-emerald-300" rows={3}
                    placeholder="توقيع المصلحة..." />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-rose-200 overflow-hidden">
              <div className="bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800 flex items-center gap-1">
                🔚 عند الخروج
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50">
                <div className="p-3">
                  <label className="text-xs font-bold text-slate-600 block mb-1">تأشيرة البياضة</label>
                  <textarea value={editData.visa_blanchisserie_sortie as string}
                    onChange={e => setEditData(d => ({ ...d, visa_blanchisserie_sortie: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-rose-300" rows={3}
                    placeholder="توقيع البياضة..." />
                </div>
                <div className="p-3">
                  <label className="text-xs font-bold text-slate-600 block mb-1">تأشيرة مصلحة الإيواء</label>
                  <textarea value={editData.visa_service_sortie as string}
                    onChange={e => setEditData(d => ({ ...d, visa_service_sortie: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-rose-300" rows={3}
                    placeholder="توقيع المصلحة..." />
                </div>
              </div>
            </div>
          </div>

          {/* Mouchoir */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 inline-flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600">🧻 ماسح الوجه</label>
            <button onClick={() => setNum('mouchoir_visage', -1)} className="w-7 h-7 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 font-bold flex items-center justify-center">−</button>
            <span className="w-8 text-center font-bold">{editData.mouchoir_visage}</span>
            <button onClick={() => setNum('mouchoir_visage', 1)} className="w-7 h-7 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold flex items-center justify-center">+</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-500" />معاينة قبل الطباعة
            </h5>
            <div className="flex items-center gap-2">
              <button onClick={() => setPreviewSide('front')}
                className={`px-3 py-1.5 text-xs rounded-lg border ${previewSide === 'front' ? 'bg-amber-100 border-amber-300 text-amber-700 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                الوجه
              </button>
              <button onClick={() => setPreviewSide('back')}
                className={`px-3 py-1.5 text-xs rounded-lg border ${previewSide === 'back' ? 'bg-slate-700 border-slate-600 text-white font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                الظهر
              </button>
              <button onClick={() => setPreviewSide(s => s === 'front' ? 'back' : 'front')} className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-400">
                {previewSide === 'front' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="hidden" ref={printRef}>
            <PrintCard student={selected} data={editData} side="front" />
            <div className="cut-line" />
            <PrintCard student={selected} data={editData} side="back" />
          </div>
          <div className="overflow-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div style={{ transform: 'scale(0.78)', transformOrigin: 'top right' }}>
              <PrintCard student={selected} data={editData} side={previewSide} />
            </div>
          </div>
          <button onClick={handlePrint}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors">
            <Printer className="w-4 h-4" />طباعة البطاقة (الوجه والظهر)
          </button>
        </div>
      )}

      {!selected && results.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col items-center justify-center py-16 text-slate-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">ابحث عن الطالب لعرض وطباعة بطاقة جرد المفروشات</p>
          <p className="text-xs mt-1 opacity-60">FICHE INVENTAIRE — SERVICE HEBERGEMENT</p>
        </div>
      )}
    </div>
  );
}
