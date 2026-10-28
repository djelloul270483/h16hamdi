import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardList, Search, Printer, QrCode, CheckCircle,
  Clock, AlertCircle, Loader2, Users, RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { getYear, RESIDENCE_NAME, DIRECTORATE } from '../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
type RegStatus = 'pending' | 'slip_printed' | 'complete';

type Registration = {
  id: string;
  student_id: string;
  nom: string;
  pavillon: string;
  chambre: string;
  numero_inscription: string;
  qr_data: string;
  slip_printed_at: string | null;
  face_scan_confirmed_at: string | null;
  status: RegStatus;
  annee: string;
  created_at: string;
};

type Student = {
  id: string;
  nom: string;
  pavillon: string;
  chambre: string;
  numero_inscription: string | null;
};

// ─── QR Printer ──────────────────────────────────────────────────────────────
async function printSlip(reg: Registration) {
  const qrDataUrl = await QRCode.toDataURL(reg.qr_data, {
    width: 200, margin: 1,
    color: { dark: '#1e293b', light: '#ffffff' },
  });

  const win = window.open('', '_blank', 'width=480,height=340');
  if (!win) return;

  const now = new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>وصل تسجيل</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; background: white;
         width: 148mm; min-height: 100mm; padding: 6mm; }
  .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 4mm; margin-bottom: 4mm; }
  .header h1 { font-size: 10pt; color: #1e293b; font-weight: bold; }
  .header p  { font-size: 8pt;  color: #64748b; }
  .title { font-size: 11pt; font-weight: bold; text-align: center;
           color: #d97706; margin: 4mm 0 5mm; }
  .body { display: flex; gap: 6mm; align-items: flex-start; }
  .info { flex: 1; }
  .row { display: flex; justify-content: space-between; margin-bottom: 3mm; font-size: 9pt; }
  .label { color: #64748b; }
  .value { font-weight: bold; color: #1e293b; }
  .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 2mm; }
  .qr-wrap img { width: 28mm; height: 28mm; }
  .qr-wrap span { font-size: 7pt; color: #94a3b8; }
  .footer { margin-top: 5mm; border-top: 1px dashed #cbd5e1; padding-top: 3mm;
            font-size: 8pt; color: #94a3b8; text-align: center; }
  .stamp-box { border: 1.5px dashed #94a3b8; border-radius: 4px;
               padding: 3mm 6mm; text-align: center; margin-top: 4mm;
               font-size: 8pt; color: #94a3b8; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${RESIDENCE_NAME}</h1>
    <p>${DIRECTORATE}</p>
  </div>
  <div class="title">وصل تسجيل الإيواء — ${reg.annee}</div>
  <div class="body">
    <div class="info">
      <div class="row"><span class="label">الاسم</span><span class="value">${reg.nom}</span></div>
      <div class="row"><span class="label">الجناح</span><span class="value">${reg.pavillon}</span></div>
      <div class="row"><span class="label">الغرفة</span><span class="value">${reg.chambre}</span></div>
      <div class="row"><span class="label">رقم التسجيل</span><span class="value">${reg.numero_inscription || '—'}</span></div>
      <div class="row"><span class="label">تاريخ الإصدار</span><span class="value">${now}</span></div>
    </div>
    <div class="qr-wrap">
      <img src="${qrDataUrl}" />
      <span>رمز QR</span>
    </div>
  </div>
  <div class="stamp-box">
    خدمة مسح الوجه — الختم هنا &nbsp;✦
  </div>
  <div class="footer">يُقدَّم هذا الوصل عند إتمام مسح الوجه — يُرجى المحافظة عليه</div>
</body>
</html>`);

  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RegStatus }) {
  const map = {
    pending:      { label: 'في الانتظار',       cls: 'bg-slate-100 text-slate-600' },
    slip_printed: { label: 'الوصل مطبوع',       cls: 'bg-amber-100 text-amber-700' },
    complete:     { label: 'مكتمل ✓',           cls: 'bg-emerald-100 text-emerald-700' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
}

// ─── Phase 1 : Search & Print ─────────────────────────────────────────────────
function Phase1({ onPrinted }: { onPrinted: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('students')
      .select('id, nom, pavillon, chambre, numero_inscription')
      .ilike('nom', `%${q.trim()}%`)
      .eq('annee', getYear())
      .limit(10);
    setResults(data || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  async function handlePrint(student: Student) {
    setPrinting(student.id);

    // Check for existing registration
    const { data: existing } = await supabase
      .from('student_registrations')
      .select('*')
      .eq('student_id', student.id)
      .eq('annee', getYear())
      .maybeSingle();

    let reg: Registration;

    if (existing) {
      reg = existing as Registration;
    } else {
      const qrData = `REG:${student.id}|NOM:${student.nom}|PAV:${student.pavillon}|CH:${student.chambre}`;
      const { data: inserted, error } = await supabase
        .from('student_registrations')
        .insert({
          student_id: student.id,
          nom: student.nom,
          pavillon: student.pavillon,
          chambre: student.chambre,
          numero_inscription: student.numero_inscription || '',
          qr_data: qrData,
          status: 'slip_printed',
          slip_printed_at: new Date().toISOString(),
          annee: getYear(),
        })
        .select()
        .single();

      if (error || !inserted) {
        setPrinting(null);
        alert('خطأ في إنشاء سجل التسجيل: ' + (error?.message || ''));
        return;
      }
      reg = inserted as Registration;
    }

    // Update status if needed
    if (existing && existing.status === 'pending') {
      await supabase
        .from('student_registrations')
        .update({ status: 'slip_printed', slip_printed_at: new Date().toISOString() })
        .eq('id', existing.id);
    }

    await printSlip(reg);
    setPrinting(null);
    onPrinted();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-500" />ابحث عن الطالب واطبع الوصل
        </h3>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="اكتب اسم الطالب..."
            className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {searching && (
            <Loader2 className="absolute left-3 top-3 w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
          {results.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center justify-between px-4 py-3 ${i < results.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div>
                <p className="font-medium text-slate-800 text-sm">{s.nom}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.pavillon} / {s.chambre}</p>
              </div>
              <button
                onClick={() => handlePrint(s)}
                disabled={printing === s.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
              >
                {printing === s.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Printer className="w-3.5 h-3.5" />}
                طباعة الوصل
              </button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400 text-sm">
          لم يُعثر على طالب بهذا الاسم في السنة الحالية
        </div>
      )}
    </div>
  );
}

// ─── Phase 3 : Confirm Face Scan ──────────────────────────────────────────────
function Phase3({ onConfirmed }: { onConfirmed: () => void }) {
  const [tab, setTab] = useState<'qr' | 'name'>('qr');
  const [qrInput, setQrInput] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState<Registration[]>([]);
  const [found, setFound] = useState<Registration | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [searching, setSearching] = useState(false);
  const qrRef = useRef<HTMLInputElement>(null);

  // Auto-focus QR input
  useEffect(() => { if (tab === 'qr') qrRef.current?.focus(); }, [tab]);

  // QR scan handler — triggered when QR scanner pastes the value
  useEffect(() => {
    if (!qrInput.trim()) return;
    const t = setTimeout(async () => {
      // Extract student_id from QR data: "REG:{id}|..."
      const match = qrInput.match(/REG:([a-f0-9\-]{36})/i);
      if (!match) {
        // Maybe the whole string is a registration id
        const { data } = await supabase
          .from('student_registrations')
          .select('*')
          .eq('qr_data', qrInput.trim())
          .maybeSingle();
        setFound(data as Registration | null);
        return;
      }
      const studentId = match[1];
      const { data } = await supabase
        .from('student_registrations')
        .select('*')
        .eq('student_id', studentId)
        .eq('annee', getYear())
        .maybeSingle();
      setFound(data as Registration | null);
    }, 300);
    return () => clearTimeout(t);
  }, [qrInput]);

  // Name search
  useEffect(() => {
    if (nameQuery.trim().length < 2) { setNameResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('student_registrations')
        .select('*')
        .ilike('nom', `%${nameQuery.trim()}%`)
        .eq('annee', getYear())
        .neq('status', 'complete')
        .limit(8);
      setNameResults((data || []) as Registration[]);
      setSearching(false);
    }, 350);
    return () => { clearTimeout(t); setSearching(false); };
  }, [nameQuery]);

  async function confirmFaceScan(reg: Registration) {
    setConfirming(true);
    const { error } = await supabase
      .from('student_registrations')
      .update({
        status: 'complete',
        face_scan_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reg.id);

    setConfirming(false);
    if (error) { alert('خطأ: ' + error.message); return; }
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setFound(null);
      setQrInput('');
      setNameQuery('');
      setNameResults([]);
      onConfirmed();
    }, 2000);
  }

  if (confirmed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-3">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
        <p className="font-bold text-emerald-800 text-lg">تم تأكيد مسح الوجه!</p>
        <p className="text-sm text-emerald-600">اكتمل تسجيل الطالب بنجاح</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-1 flex gap-1">
        {(['qr', 'name'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setFound(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t === 'qr' ? <><QrCode className="w-4 h-4" />مسح QR</> : <><Search className="w-4 h-4" />بحث بالاسم</>}
          </button>
        ))}
      </div>

      {/* QR tab */}
      {tab === 'qr' && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 space-y-3">
          <p className="text-sm text-slate-500">ضع المؤشر في الحقل أدناه ثم امسح الرمز بالقارئ:</p>
          <input
            ref={qrRef}
            type="text"
            value={qrInput}
            onChange={e => setQrInput(e.target.value)}
            placeholder="قارئ QR سيملأ هذا الحقل تلقائياً..."
            className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50 text-center"
            autoComplete="off"
          />
          {qrInput && !found && (
            <p className="text-xs text-slate-400 text-center">جاري البحث...</p>
          )}
        </div>
      )}

      {/* Name tab */}
      {tab === 'name' && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={nameQuery}
              onChange={e => setNameQuery(e.target.value)}
              placeholder="اكتب اسم الطالب..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searching && <Loader2 className="absolute left-3 top-3 w-4 h-4 animate-spin text-slate-400" />}
          </div>
          {nameResults.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="font-medium text-slate-800 text-sm">{r.nom}</p>
                <p className="text-xs text-slate-400">{r.pavillon} / {r.chambre}</p>
                <StatusBadge status={r.status} />
              </div>
              <button
                onClick={() => setFound(r)}
                className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors"
              >
                تحديد
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Found student card */}
      {found && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-800 text-base">{found.nom}</p>
              <p className="text-sm text-slate-500 mt-0.5">{found.pavillon} / {found.chambre}</p>
            </div>
            <StatusBadge status={found.status} />
          </div>

          {found.status === 'complete' ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              تسجيل مكتمل — تم تأكيد مسح الوجه
            </div>
          ) : (
            <button
              onClick={() => confirmFaceScan(found)}
              disabled={confirming}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {confirming
                ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التأكيد...</>
                : <><CheckCircle className="w-4 h-4" />تأكيد إتمام مسح الوجه</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Registration List ────────────────────────────────────────────────────────
function RegistrationList() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | RegStatus>('all');

  async function load() {
    setLoading(true);
    let q = supabase
      .from('student_registrations')
      .select('*')
      .eq('annee', getYear())
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRegs((data || []) as Registration[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  const counts = {
    all: regs.length,
    pending: regs.filter(r => r.status === 'pending').length,
    slip_printed: regs.filter(r => r.status === 'slip_printed').length,
    complete: regs.filter(r => r.status === 'complete').length,
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'الكل'],
          ['pending', 'في الانتظار'],
          ['slip_printed', 'الوصل مطبوع'],
          ['complete', 'مكتمل'],
        ] as [string, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === val ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {label} ({counts[val as keyof typeof counts] ?? 0})
          </button>
        ))}
        <button onClick={load} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors mr-auto">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : regs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
          لا توجد سجلات تسجيل بعد
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
          {regs.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between px-4 py-3 ${i < regs.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 text-sm truncate">{r.nom}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.pavillon} / {r.chambre}</p>
              </div>
              <div className="flex items-center gap-2 mr-2">
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Registration() {
  const [tab, setTab] = useState<'phase1' | 'phase3' | 'list'>('phase1');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: typeof tab; label: string; icon: React.ElementType }[] = [
    { id: 'phase1', label: 'طباعة الوصل',     icon: Printer      },
    { id: 'phase3', label: 'تأكيد مسح الوجه', icon: QrCode       },
    { id: 'list',   label: 'قائمة التسجيلات', icon: Users        },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-sky-600 to-sky-700 rounded-xl p-4 text-white flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg">تسجيل الإيواء</h2>
          <p className="text-xs text-sky-100 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />السنة الأكاديمية: {getYear()}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-sm text-sky-700">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-sky-500" />
        <p>
          <strong>المرحلة 1 (مكتب الإيواء):</strong> ابحث عن الطالب واطبع الوصل الذي يحمله لخدمة مسح الوجه.
          &nbsp;|&nbsp;
          <strong>المرحلة 2 (مكتب الوجه):</strong> عند عودته، امسح QR أو ابحث بالاسم وأكّد الإتمام.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-1 flex gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${tab === id ? 'bg-sky-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'phase1' && <Phase1 onPrinted={() => setRefreshKey(k => k + 1)} />}
      {tab === 'phase3' && <Phase3 onConfirmed={() => setRefreshKey(k => k + 1)} />}
      {tab === 'list'   && <RegistrationList key={refreshKey} />}
    </div>
  );
}
