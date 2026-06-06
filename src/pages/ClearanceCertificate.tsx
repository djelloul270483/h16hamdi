import { useState, useRef, useEffect } from 'react';
import { Search, Printer, FileCheck, LogOut, RefreshCw } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { RESIDENCE_NAME, DIRECTORATE, getYear, NATIONAL_OFFICE } from '../lib/constants';
import QRCode from 'qrcode';

type CertType = 'final' | 'renewal';

function Row({ label, value, highlight = false }: {
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-dashed border-emerald-200/60 last:border-0">
      <span className="text-slate-700 text-[12px] font-bold">{label}</span>
      <span className={`font-bold text-[13px] ${highlight ? 'text-emerald-800' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

export default function ClearanceCertificate() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [certType, setCertType] = useState<CertType>('final');
  const printRef = useRef<HTMLDivElement>(null);

  const year = getYear();

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('matricule_bac', query.trim())
      .limit(10);
    setResults(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!selected) return;
    QRCode.toDataURL(
      JSON.stringify({ type: certType, id: selected.id, nom: selected.nom, year }),
      { width: 120, margin: 1 }
    ).then(setQrUrl);
  }, [selected, certType]);

  const today = new Date().toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' });

  const isFinal = certType === 'final';

  const checkItems = isFinal
    ? [
        { label: 'تسديد مستحقات الإيواء', done: selected?.paiement_hebergement ?? false },
        { label: 'إعادة مفتاح الغرفة', done: selected?.cle_remise ?? false },
        { label: 'تسليم مفروشات الغرفة بحالة سليمة', done: true },
      ]
    : [
        { label: 'تسديد مستحقات الإيواء', done: selected?.paiement_hebergement ?? false },
        { label: 'تجديد وثائق التسجيل', done: true },
        { label: 'استلام مفتاح الغرفة للسنة الجديدة', done: true },
      ];

  return (
    <div className="space-y-5" dir="rtl">
      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 print:hidden">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />إعداد شهادة التبرئة
        </h3>

        {/* نوع الشهادة */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCertType('final')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              isFinal
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <LogOut className="w-4 h-4" /> تبرئة نهائية
          </button>
          <button
            onClick={() => setCertType('renewal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              !isFinal
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> تجديد
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="أدخل رقم التسجيل (بكالوريا) للبحث..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={search}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />بحث
          </button>
        </div>

        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {results.map(s => (
              <li key={s.id}>
                <button
                  className={`w-full text-right px-4 py-3 text-sm hover:bg-emerald-50 transition-colors flex justify-between items-center ${selected?.id === s.id ? 'bg-emerald-50 font-semibold' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <span className="text-slate-800 font-medium">{s.nom}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.paiement_hebergement ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                      {s.paiement_hebergement ? 'مسدد' : 'غير مسدد'}
                    </span>
                    <span className="text-slate-400 text-xs">{s.matricule_bac || '—'}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <>
          {!selected.paiement_hebergement && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2 print:hidden">
              <span className="text-amber-500 font-bold">!</span>
              <span>تنبيه: هذا الطالب لم يسدد مستحقات الإيواء بعد.</span>
            </div>
          )}

          <div className="flex justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />طباعة الشهادة
            </button>
          </div>

          {/* Certificate */}
          <div ref={printRef} className="print-section">
            <div className="cert-frame" dir="rtl" style={{ fontFamily: "'Amiri', 'Arial', sans-serif" }}>
              <div className="cert-corner cert-corner-tl" />
              <div className="cert-corner cert-corner-tr" />
              <div className="cert-corner cert-corner-bl" />
              <div className="cert-corner cert-corner-br" />

              <div className="relative" style={{ padding: '4mm 6mm' }}>
                {/* Header */}
                <div className="text-center mb-2">
                  <p className="text-[12px] font-bold text-slate-700 tracking-wide">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                  <p className="text-[12px] font-bold text-slate-700 tracking-wide">وزارة التعليم العالي والبحث العلمي</p>
                  <p className="text-[12px] font-bold text-emerald-700 tracking-wide mt-0.5">{NATIONAL_OFFICE}</p>
                  <p className="text-[13px] font-extrabold text-slate-800 mt-1">{DIRECTORATE}</p>
                  <p className="text-[15px] font-extrabold text-slate-900 mt-0.5">{RESIDENCE_NAME}</p>
                </div>

                {/* Green-gold separator */}
                <div
                  className="h-[3px] my-3"
                  style={{ background: 'linear-gradient(90deg, transparent, #059669, #b8860b, #059669, transparent)' }}
                />

                {/* Certificate title */}
                <div className="text-center mb-3">
                  <h2
                    className="text-[34px] font-extrabold text-emerald-800 tracking-wider"
                    style={{ textShadow: '0 1px 3px rgba(0,100,60,0.2)', letterSpacing: '0.08em' }}
                  >
                    {isFinal ? 'شهادة التبرئة النهائية' : 'شهادة التجديد'}
                  </h2>
                  <p className="text-[11px] font-bold text-emerald-600 mt-0.5 tracking-widest">
                    {isFinal ? 'ATTESTATION DE DÉCHARGE FINALE' : 'ATTESTATION DE RENOUVELLEMENT'}
                  </p>
                </div>

                <div
                  className="h-[3px] mb-4"
                  style={{ background: 'linear-gradient(90deg, transparent, #059669, #b8860b, #059669, transparent)' }}
                />

                {/* Body */}
                <div className="text-[13px] leading-7">
                  <p className="text-slate-700 mb-3 font-medium">
                    يشهد مدير الإقامة الجامعية عين الباي 16 بأن الطالب/ة:
                  </p>

                  <div className="bg-gradient-to-b from-emerald-50/60 to-white rounded-lg p-4 border border-emerald-200/50 mb-4">
                    <Row label="الاسم الكامل" value={selected.nom} />
                    {selected.date_naissance && <Row label="تاريخ الميلاد" value={selected.date_naissance} />}
                    {selected.lieu_naissance && <Row label="مكان الميلاد" value={selected.lieu_naissance} />}
                    <Row label="الجنسية" value={selected.nationalite || '—'} />
                    <Row label="رقم التسجيل" value={selected.matricule_bac || '—'} />
                    <Row label="الجناح" value={selected.pavillon || '—'} highlight />
                    <Row label="رقم الغرفة" value={selected.chambre ? String(parseInt(selected.chambre.replace(/^.*[-_]/, ''), 10) || selected.chambre) : '—'} highlight />
                  </div>

                  <p className="text-slate-700 mb-3" dir="rtl">
                    {isFinal
                      ? <>{`قد أتم إجراءات مغادرة الإقامة الجامعية عين الباي 16 للسنة الجامعية `}<bdi>{year}</bdi>{`، وذلك بعد:`}</>
                      : <>{`قد أتم إجراءات تجديد إقامته في الإقامة الجامعية عين الباي 16 للسنة الجامعية `}<bdi>{year}</bdi>{`، وذلك بعد:`}</>
                    }
                  </p>

                  <div className="space-y-2 mb-4">
                    {checkItems.map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-3 text-[13px]">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${done ? 'bg-emerald-500' : 'bg-red-400'}`}>
                          {done ? '✓' : '✗'}
                        </span>
                        <span className={done ? 'text-slate-700 font-medium' : 'text-red-600 font-medium'}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-slate-700">
                    {isFinal
                      ? 'وتُسلَّم له هذه الشهادة بناءً على طلبه لإثبات تبرئة ذمته النهائية تجاه الإقامة الجامعية.'
                      : `وتُسلَّم له هذه الشهادة بناءً على طلبه لإثبات تجديد إقامته للسنة الجامعية ${year}.`
                    }
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end" style={{ marginTop: '16mm' }}>
                  <div className="text-center">
                    {qrUrl && (
                      <div>
                        <img src={qrUrl} alt="QR" className="w-20 h-20 mx-auto border border-emerald-200/50 rounded" />
                        <p className="text-[9px] text-slate-400 mt-1">رمز التحقق</p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-slate-600 mb-1">قسنطينة، بتاريخ: {today}</p>
                    <p className="text-[12px] font-semibold text-slate-600 mb-14">مدير الإقامة الجامعية</p>
                    <div className="border-t border-dashed border-slate-300 pt-1">
                      <p className="text-[10px] text-slate-400">الختم والإمضاء</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!selected && results.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400 print:hidden">
          <FileCheck className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">ابحث عن الطالب لإنشاء شهادة التبرئة</p>
        </div>
      )}
    </div>
  );
}
