import { useState, useRef, useEffect } from 'react';
import { Search, Printer, QrCode, FileText, Languages } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { RESIDENCE_NAME, DIRECTORATE, getYear, NATIONAL_OFFICE } from '../lib/constants';
import QRCode from 'qrcode';

type Lang = 'ar' | 'en';

const TRANSLATIONS = {
  ar: {
    pageTitle: 'إعداد شهادة الإيواء',
    searchPlaceholder: 'أدخل رقم التسجيل (بكالوريا) للبحث...',
    searchBtn: 'بحث',
    republic: 'الجمهورية الجزائرية الديمقراطية الشعبية',
    ministry: 'وزارة التعليم العالي والبحث العلمي',
    directorate: DIRECTORATE,
    residence: RESIDENCE_NAME,
    certTitle: 'شهادة الإيواء',
    certSubtitle: "ATTESTATION D'HÉBERGEMENT",
    bodyText: 'يشهد مدير الإقامة الجامعية عين الباي 16 بأن الطالب/ة:',
    fullName: 'الاسم الكامل',
    dob: 'تاريخ الميلاد',
    pob: 'مكان الميلاد',
    nationality: 'الجنسية',
    regNo: 'رقم التسجيل',
    field: 'التخصص',
    level: 'المستوى',
    pavilion: 'الجناح',
    room: 'رقم الغرفة',
    date: (today: string) => `قسنطينة، بتاريخ: ${today}`,
    director: 'مدير الإقامة الجامعية',
    stamp: 'الختم والإمضاء',
    qrLabel: 'رمز التحقق',
    printBtn: 'طباعة الشهادة',
    emptyMsg: 'ابحث عن الطالب لإنشاء شهادة الإيواء',
    langToggle: 'English',
  },
  en: {
    pageTitle: 'Housing Certificate',
    searchPlaceholder: 'Enter registration number (BAC)...',
    searchBtn: 'Search',
    republic: "People's Democratic Republic of Algeria",
    ministry: 'Ministry of Higher Education and Scientific Research',
    directorate: 'University Services Directorate - Ain El Bey - Constantine',
    residence: 'University Residence Ain El Bey 16',
    certTitle: 'Housing Certificate',
    certSubtitle: "ATTESTATION D'HÉBERGEMENT",
    bodyText: 'The Director of University Residence Ain El Bey 16 certifies that the student:',
    fullName: 'Full Name',
    dob: 'Date of Birth',
    pob: 'Place of Birth',
    nationality: 'Nationality',
    regNo: 'Registration No.',
    field: 'Field of Study',
    level: 'Level',
    pavilion: 'Pavilion',
    room: 'Room No.',
    date: (today: string) => `Constantine, on: ${today}`,
    director: 'Director of University Residence',
    stamp: 'Stamp & Signature',
    qrLabel: 'Verification Code',
    printBtn: 'Print Certificate',
    emptyMsg: 'Search for a student to generate a housing certificate',
    langToggle: 'عربي',
  },
} as const;

function Row({ label, value, highlight = false, rtl = true }: {
  label: string; value: string; highlight?: boolean; rtl?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-dashed border-amber-200/60 last:border-0 ${rtl ? '' : 'flex-row-reverse'}`}>
      <span className="text-slate-700 text-[12px] font-bold">{label}</span>
      <span className={`font-bold text-[13px] ${highlight ? 'text-amber-800' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

export default function HousingCertificate() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>('ar');
  const printRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';
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
      JSON.stringify({ type: 'housing', id: selected.id, nom: selected.nom, chambre: selected.chambre, year }),
      { width: 120, margin: 1 }
    ).then(setQrUrl);
  }, [selected]);

  const todayAr = new Date().toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' });
  const todayEn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const today = isAr ? todayAr : todayEn;

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 print:hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />{t.pageTitle}
          </h3>
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />{t.langToggle}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={search}
            disabled={loading}
            className="px-4 py-2.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />{t.searchBtn}
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {results.map(s => (
              <li key={s.id}>
                <button
                  className={`w-full ${isAr ? 'text-right' : 'text-left'} px-4 py-3 text-sm hover:bg-amber-50 transition-colors flex justify-between items-center ${selected?.id === s.id ? 'bg-amber-50 font-semibold' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <span className="text-slate-800 font-medium">{s.nom}</span>
                  <span className="text-slate-400 text-xs">{s.matricule_bac || '—'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <>
          <div className={`flex ${isAr ? 'justify-end' : 'justify-start'} print:hidden`}>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />{t.printBtn}
            </button>
          </div>

          {/* Certificate */}
          <div ref={printRef} className="print-section">
            <div className="cert-frame" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: "'Amiri', 'Arial', sans-serif" }}>
              <div className="cert-corner cert-corner-tl" />
              <div className="cert-corner cert-corner-tr" />
              <div className="cert-corner cert-corner-bl" />
              <div className="cert-corner cert-corner-br" />

              <div className="relative" style={{ padding: '4mm 6mm' }}>
                {/* Header */}
                <div className="text-center mb-2">
                  <p className="text-[12px] font-bold text-slate-700 tracking-wide">{t.republic}</p>
                  <p className="text-[12px] font-bold text-slate-700 tracking-wide">{t.ministry}</p>
                  <p className="text-[12px] font-bold text-amber-700 tracking-wide mt-0.5">{NATIONAL_OFFICE}</p>
                  <p className="text-[13px] font-extrabold text-slate-800 mt-1">{t.directorate}</p>
                  <p className="text-[15px] font-extrabold text-slate-900 mt-0.5">{t.residence}</p>
                </div>

                {/* Gold separator */}
                <div className="cert-gold-line my-3" />

                {/* Certificate title */}
                <div className="text-center mb-3">
                  <h2
                    className="text-[34px] font-extrabold text-amber-800 tracking-wider"
                    style={{ textShadow: '0 1px 3px rgba(180,120,0,0.2)', letterSpacing: '0.08em' }}
                  >
                    {t.certTitle}
                  </h2>
                  <p className="text-[11px] font-bold text-amber-600 mt-0.5 tracking-widest">{t.certSubtitle}</p>
                </div>

                <div className="cert-gold-line mb-4" />

                {/* Body */}
                <div className="text-[13px] leading-7">
                  <p className="text-slate-700 mb-3 font-medium" dir={isAr ? 'rtl' : 'ltr'}>
                    {isAr ? (
                      <>يشهد مدير الإقامة الجامعية عين الباي 16 بأن الطالب/ة:</>
                    ) : (
                      <>The Director of University Residence Ain El Bey 16 certifies that the student:</>
                    )}
                  </p>

                  <div className="bg-gradient-to-b from-amber-50/60 to-white rounded-lg p-4 border border-amber-200/50 mb-4">
                    <Row label={t.fullName} value={selected.nom} rtl={isAr} />
                    {selected.date_naissance && (
                      <Row label={t.dob} value={selected.date_naissance} rtl={isAr} />
                    )}
                    {selected.lieu_naissance && (
                      <Row label={t.pob} value={selected.lieu_naissance} rtl={isAr} />
                    )}
                    <Row label={t.nationality} value={selected.nationalite || '—'} rtl={isAr} />
                    <Row label={t.regNo} value={selected.matricule_bac || '—'} rtl={isAr} />
                    <Row label={t.field} value={selected.filiere || '—'} rtl={isAr} />
                    <Row label={t.level} value={selected.niveau || '—'} rtl={isAr} />
                    <Row label={t.pavilion} value={selected.pavillon || '—'} highlight rtl={isAr} />
                    <Row label={t.room} value={selected.chambre ? String(parseInt(selected.chambre.replace(/^.*[-_]/, ''), 10) || selected.chambre) : '—'} highlight rtl={isAr} />
                  </div>

                  {/* Conclusion */}
                  {isAr ? (
                    <p className="text-slate-700 leading-8" dir="rtl">
                      {'مقيم/ة بالإقامة الجامعية عين الباي 16 خلال السنة الجامعية '}
                      <bdi>{year}</bdi>
                      {'، وذلك لإثبات الإيواء وللاستعمال الذي يراه مناسباً.'}
                    </p>
                  ) : (
                    <p className="text-slate-700 leading-8" dir="ltr">
                      {'is a resident of University Residence Ain El Bey 16 for the academic year '}
                      <strong className="text-amber-800 font-extrabold">{year}</strong>
                      {'. This certificate is issued to prove accommodation and for whatever purpose deemed necessary.'}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end" style={{ marginTop: '16mm' }}>
                  <div className="text-center">
                    {qrUrl && (
                      <div>
                        <img src={qrUrl} alt="QR" className="w-20 h-20 mx-auto border border-amber-200/50 rounded" />
                        <p className="text-[9px] text-slate-400 mt-1">{t.qrLabel}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-slate-600 mb-1">{t.date(today)}</p>
                    <p className="text-[12px] font-extrabold text-slate-900 mb-14">{t.director}</p>
                    <div className="border-t border-dashed border-slate-300 pt-1">
                      <p className="text-[10px] text-slate-400">{t.stamp}</p>
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
          <QrCode className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">{t.emptyMsg}</p>
        </div>
      )}
    </div>
  );
}
