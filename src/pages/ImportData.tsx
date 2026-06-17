import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Wifi, ArrowRight, History, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ImportStatus {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  phase: 'idle' | 'reading' | 'mapping' | 'importing' | 'done' | 'error';
  columnMap: Record<string, string>;
  unmappedHeaders: string[];
}

const BATCH_SIZE = 25;

const HEADER_ALIASES: Record<string, string> = {
  // Standard format headers (from the template Excel file)
  'annee de bac': 'annee_bac',
  'matricule de bac': 'matricule_bac',
  'wilaya de bac': 'wilaya_bac',
  "numéro d'inscription": 'numero_inscription',
  'nom': 'nom',
  'date de naissance': 'date_naissance',
  'lieu de naissance': 'lieu_naissance',
  'lieu naissance': 'lieu_naissance',
  'sexe': 'sexe',
  'nationalité': 'nationalite',
  'résidence': 'residence',
  'pavillon': 'pavillon',
  'chambre': 'chambre',
  'commune': 'commune',
  'etablissement': 'etablissement',
  'domaine': 'domaine',
  'filière': 'filiere',
  'niveau': 'niveau',
  'frais inscription payé': 'frais_inscription_paye',
  'paiement hébergement': 'paiement_hebergement',
  'clé remise': 'cle_remise',

  // Alternative French formats
  'annee bac': 'annee_bac',
  'année bac': 'annee_bac',
  'annee_bac': 'annee_bac',
  'matricule bac': 'matricule_bac',
  'matricule_bac': 'matricule_bac',
  'wilaya bac': 'wilaya_bac',
  'wilaya_bac': 'wilaya_bac',
  'n° inscription': 'numero_inscription',
  'n inscription': 'numero_inscription',
  'numero inscription': 'numero_inscription',
  'num inscription': 'numero_inscription',
  'numero_inscription': 'numero_inscription',
  'numéro inscription': 'numero_inscription',
  'date naissance': 'date_naissance',
  'frais inscription paye': 'frais_inscription_paye',
  'frais_inscription_paye': 'frais_inscription_paye',
  'frais inscription': 'frais_inscription_paye',
  'paiement hebergement': 'paiement_hebergement',
  'paiement_hebergement': 'paiement_hebergement',
  'paiement': 'paiement_hebergement',
  'cle remise': 'cle_remise',
  'cle_remise': 'cle_remise',

  // Arabic alternatives
  'الرقم الوطني': 'nin',
  'رقم التعريف الوطني': 'nin',
  'سنة البكالوريا': 'annee_bac',
  'عام البكالوريا': 'annee_bac',
  'رقم بكالوريا': 'matricule_bac',
  'رقم التسجيل بكالوريا': 'matricule_bac',
  'ولاية البكالوريا': 'wilaya_bac',
  'ولاية بك': 'wilaya_bac',
  'رقم التسجيل': 'numero_inscription',
  'رقم التسجيل الجامعي': 'numero_inscription',
  'رقم التسجيل في الجامعة': 'numero_inscription',
  'الاسم واللقب': 'nom',
  'الاسم الكامل': 'nom',
  'اسم الطالب': 'nom',
  'الاسم و اللقب': 'nom',
  'اللقب والاسم': 'nom',
  'تاريخ الميلاد': 'date_naissance',
  'مكان الميلاد': 'lieu_naissance',
  'مكان الازدياد': 'lieu_naissance',
  'مكان ازدياد': 'lieu_naissance',
  'مكان الولادة': 'lieu_naissance',
  'الجنس': 'sexe',
  'جنس': 'sexe',
  'الجنسية': 'nationalite',
  'الإقامة': 'residence',
  'اقامة': 'residence',
  'الجناح': 'pavillon',
  'جناح': 'pavillon',
  'الغرفة': 'chambre',
  'غرفة': 'chambre',
  'رقم الغرفة': 'chambre',
  'البلدية': 'commune',
  'بلدية': 'commune',
  'المؤسسة': 'etablissement',
  'مؤسسة': 'etablissement',
  'الجامعة': 'etablissement',
  'الميدان': 'domaine',
  'ميدان': 'domaine',
  'التخصص': 'filiere',
  'تخصص': 'filiere',
  'المستوى': 'niveau',
  'مستوى': 'niveau',
  'رسوم التسجيل': 'frais_inscription_paye',
  'رسوم التسجيل مدفوعة': 'frais_inscription_paye',
  'تسديد الإيواء': 'paiement_hebergement',
  'تسديد مستحقات الإيواء': 'paiement_hebergement',
  'دفع الإيواء': 'paiement_hebergement',
  'تسليم المفتاح': 'cle_remise',
  'مفتاح': 'cle_remise',
  'المفتاح': 'cle_remise',
  'nin': 'nin',
  'code photo': 'code_photo',
  'code_photo': 'code_photo',
  'رمز الصورة': 'code_photo',
  'كود الصورة': 'code_photo',
  'n.i.n': 'nin',
  'رقم التسجيل الوطني': 'nin',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/ç/g, 'c');
}

// Known DB columns to prevent partial-match collisions
const DB_COLUMNS = new Set([
  'nin', 'code_photo', 'annee_bac', 'matricule_bac', 'wilaya_bac',
  'numero_inscription', 'nom', 'date_naissance', 'lieu_naissance', 'sexe', 'nationalite',
  'residence', 'pavillon', 'chambre', 'commune', 'etablissement',
  'domaine', 'filiere', 'niveau', 'frais_inscription_paye',
  'paiement_hebergement', 'cle_remise',
]);

function resolveColumn(excelHeader: string): string | null {
  const trimmed = excelHeader.trim();
  // Exact match first
  if (HEADER_ALIASES[trimmed]) return HEADER_ALIASES[trimmed];
  if (HEADER_ALIASES[trimmed.toLowerCase()]) return HEADER_ALIASES[trimmed.toLowerCase()];
  // Normalized match
  const norm = normalizeHeader(trimmed);
  if (HEADER_ALIASES[norm]) return HEADER_ALIASES[norm];
  // Partial match with safety check: only match if the alias key
  // is a significant portion of the header (>= 60% of the longer string)
  // AND the result hasn't already been assigned
  for (const [alias, dbCol] of Object.entries(HEADER_ALIASES)) {
    const normAlias = normalizeHeader(alias);
    if (norm === normAlias) return dbCol;
    if (norm.includes(normAlias) || normAlias.includes(norm)) {
      const longer = Math.max(norm.length, normAlias.length);
      const shorter = Math.min(norm.length, normAlias.length);
      if (shorter / longer >= 0.6) return dbCol;
    }
  }
  return null;
}

function parseBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    return v === 'oui' || v === 'yes' || v === 'نعم' || v === '1' || v === 'true' || v === 'vrai';
  }
  if (typeof val === 'number') return val !== 0;
  return false;
}

function normalizeSexe(val: unknown): string {
  if (!val) return '';
  const v = String(val).trim().toLowerCase();
  if (v === 'garçon' || v === 'garcon' || v === 'm' || v === 'male' || v === 'ذكر' || v === 'masc') return 'Garçon';
  if (v === 'fille' || v === 'f' || v === 'female' || v === 'أنثى' || v === 'fem') return 'Fille';
  return String(val).trim();
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const m = val.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return val;
    const m2 = val.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  }
  return null;
}

function translateError(msg: string): string {
  const map: Record<string, string> = {
    'duplicate key value violates unique constraint': 'تضارب في رقم التسجيل - يوجد طالب مسجل بنفس الرقم',
    'null value in column': 'قيمة فارغة في حقل مطلوب',
    'value too long for type': 'قيمة أطول من الحد المسموح',
    'violates foreign key constraint': 'مرجع غير موجود في الجدول المرتبط',
    'permission denied': 'صلاحية مرفوضة - تحقق من اتصال قاعدة البيانات',
    'network': 'خطأ في الشبكة - تحقق من اتصال الإنترنت',
    'failed to fetch': 'فشل الاتصال بالخادم - تحقق من اتصال الإنترنت وأعد المحاولة',
    'load failed': 'فشل تحميل البيانات - تحقق من اتصال الإنترنت',
    'networkerror': 'خطأ في الشبكة - تحقق من اتصال الإنترنت',
    'typeerror': 'خطأ في الاتصال - تحقق من اتصال الإنترنت',
    'fetch': 'فشل الاتصال - تحقق من اتصال الإنترنت',
  };
  const lower = msg.toLowerCase();
  for (const [key, ar] of Object.entries(map)) {
    if (lower.includes(key)) return ar;
  }
  return msg;
}

export default function ImportData() {
  const [status, setStatus] = useState<ImportStatus>({
    total: 0, imported: 0, updated: 0, skipped: 0, errors: [], phase: 'idle',
    columnMap: {}, unmappedHeaders: [],
  });
  const [dragOver, setDragOver] = useState(false);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);
  const [importLogs, setImportLogs] = useState<Array<{ date: string; file: string; added: number; updated: number; algerien: number; etranger: number }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load import history from localStorage
  function loadHistory() {
    try {
      const raw = localStorage.getItem('import_logs');
      if (raw) setImportLogs(JSON.parse(raw));
    } catch { /* ignore */ }
    setShowHistory(true);
  }

  function saveLog(file: string, added: number, updated: number, algerien: number, etranger: number) {
    try {
      const raw = localStorage.getItem('import_logs');
      const logs = raw ? JSON.parse(raw) : [];
      logs.unshift({ date: new Date().toISOString(), file, added, updated, algerien, etranger });
      localStorage.setItem('import_logs', JSON.stringify(logs.slice(0, 50))); // keep last 50
    } catch { /* ignore */ }
  }

  async function testNetwork() {
    try {
      const { error } = await supabase.from('students').select('id').limit(1);
      setNetworkOk(!error);
    } catch {
      setNetworkOk(false);
    }
  }

  const processFile = useCallback(async (file: File) => {
    // Full reset on new file
    setStatus({ total: 0, imported: 0, updated: 0, skipped: 0, errors: [], phase: 'reading', columnMap: {}, unmappedHeaders: [] });

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        setStatus(s => ({ ...s, phase: 'error', errors: ['الملف فارغ أو لا يحتوي على بيانات'] }));
        return;
      }

      // Build column mapping from actual headers
      const headers = Object.keys(rows[0]);
      const columnMap: Record<string, string> = {};
      const unmappedHeaders: string[] = [];
      const assignedCols = new Set<string>();

      headers.forEach(h => {
        const dbCol = resolveColumn(h);
        if (dbCol && !assignedCols.has(dbCol)) {
          columnMap[h] = dbCol;
          assignedCols.add(dbCol);
        } else {
          unmappedHeaders.push(h);
        }
      });

      setStatus(s => ({ ...s, phase: 'mapping', columnMap, unmappedHeaders }));

      // Transform rows using the mapping
      const records = rows.map(row => {
        const rec: Record<string, unknown> = {};
        Object.entries(columnMap).forEach(([excelCol, dbCol]) => {
          rec[dbCol] = row[excelCol];
        });
        return rec;
      }).filter(r => r.nom && String(r.nom).trim());

      if (records.length === 0) {
        setStatus(s => ({
          ...s, phase: 'error',
          errors: [
            'لم يتم العثور على بيانات صالحة.',
            `تم العثور على ${rows.length} صف لكن لا يوجد عمود "الاسم" (nom).`,
            `الأعمدة المكتشفة: ${headers.join(', ')}`,
            `الأعمدة المعينة: ${Object.entries(columnMap).map(([e, d]) => `${e} → ${d}`).join(', ') || 'لا يوجد'}`,
          ],
        }));
        return;
      }

      // Filter out records without matricule_bac AND without NIN
      const validRecords = records.filter(r => 
        String(r.matricule_bac || '').trim() !== '' || String(r.nin || '').trim() !== ''
      );
      const noMatricule = records.length - validRecords.length;

      // Fetch ALL existing students with their matricule_bac and NIN
      let existingData: { id: string; matricule_bac: string | null; nin: string | null }[] = [];
      try {
        const { data, error: fetchErr } = await supabase.from('students').select('id, matricule_bac, nin');
        if (fetchErr) throw fetchErr;
        existingData = data || [];
      } catch (fetchErr) {
        setStatus(s => ({ ...s, phase: 'error', errors: [`فشل الاتصال بقاعدة البيانات: ${translateError(String(fetchErr))}`] }));
        return;
      }

      // Build lookup maps by matricule_bac and NIN
      const byMatricule = new Map<string, string>(); // matricule_bac → student id
      const byNin = new Map<string, string>(); // nin → student id
      existingData.forEach(e => {
        if (e.matricule_bac && String(e.matricule_bac).trim()) byMatricule.set(String(e.matricule_bac).trim(), e.id);
        if (e.nin && String(e.nin).trim()) byNin.set(String(e.nin).trim(), e.id);
      });

      // Classify records: existing (found by matricule or NIN) vs new
      const toUpdate: { id: string; record: Record<string, unknown> }[] = [];
      const newRecords: Record<string, unknown>[] = [];

      validRecords.forEach(r => {
        const matBac = String(r.matricule_bac || '').trim();
        const nin = String(r.nin || '').trim();
        const existingId = byMatricule.get(matBac) || byNin.get(nin) || null;
        if (existingId) {
          toUpdate.push({ id: existingId, record: r });
        } else {
          newRecords.push(r);
        }
      });

      setStatus(s => ({ ...s, total: records.length, phase: 'importing' }));

      let imported = 0;
      let updated = 0;
      let skipped = noMatricule;
      const errors: string[] = [];

      if (noMatricule > 0) {
        errors.push(`تم تجاهل ${noMatricule} سجل بدون رقم تسجيل`);
      }

      // Insert new students
      for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
        const batch = newRecords.slice(i, i + BATCH_SIZE).map(r => {
          const numIns = String(r.numero_inscription || '').trim();
          return {
            nin: String(r.nin || ''),
            code_photo: String(r.code_photo || ''),
            annee_bac: r.annee_bac ? parseInt(String(r.annee_bac), 10) || null : null,
            matricule_bac: String(r.matricule_bac || '').trim(),
            wilaya_bac: String(r.wilaya_bac || ''),
            numero_inscription: numIns || `AUTO-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            nom: String(r.nom || '').trim(),
            date_naissance: parseDate(r.date_naissance),
            lieu_naissance: String(r.lieu_naissance || ''),
            sexe: normalizeSexe(r.sexe),
            nationalite: String(r.nationalite || ''),
            residence: String(r.residence || ''),
            pavillon: String(r.pavillon || ''),
            chambre: String(r.chambre || ''),
            commune: String(r.commune || ''),
            etablissement: String(r.etablissement || ''),
            domaine: String(r.domaine || ''),
            filiere: String(r.filiere || ''),
            niveau: String(r.niveau || ''),
            frais_inscription_paye: parseBoolean(r.frais_inscription_paye),
            paiement_hebergement: parseBoolean(r.paiement_hebergement),
            cle_remise: parseBoolean(r.cle_remise),
          };
        });

        try {
          const { error } = await supabase.from('students').insert(batch);

          if (error) {
            for (const record of batch) {
              try {
                const { error: singleError } = await supabase.from('students').insert(record);
                if (singleError) {
                  skipped++;
                  if (errors.length < 10) {
                    errors.push(`${record.nom}: ${translateError(singleError.message)}`);
                  }
                } else {
                  imported++;
                }
              } catch {
                skipped++;
                if (errors.length < 10) errors.push(`${record.nom}: خطأ في الاتصال`);
              }
            }
          } else {
            imported += batch.length;
          }
        } catch {
          for (const record of batch) {
            try {
              const { error: singleError } = await supabase.from('students').insert(record);
              if (singleError) { skipped++; }
              else { imported++; }
            } catch { skipped++; }
          }
        }

        setStatus(s => ({ ...s, imported, skipped }));
      }

      // Update existing students by ID — updates ALL fields including pavillon and chambre
      for (const { id, record: r } of toUpdate) {
        const updateData: Record<string, unknown> = {
          pavillon: String(r.pavillon || ''),
          chambre: String(r.chambre || ''),
          cle_remise: parseBoolean(r.cle_remise),
          paiement_hebergement: parseBoolean(r.paiement_hebergement),
          niveau: String(r.niveau || '') || undefined,
          filiere: String(r.filiere || '') || undefined,
          etablissement: String(r.etablissement || '') || undefined,
          domaine: String(r.domaine || '') || undefined,
          updated_at: new Date().toISOString(),
        };
        // Remove undefined keys
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

        try {
          const { error } = await supabase.from('students').update(updateData).eq('id', id);
          if (error) {
            skipped++;
            if (errors.length < 10) errors.push(`${r.nom || id}: ${translateError(error.message)}`);
          } else {
            updated++;
          }
        } catch {
          skipped++;
          if (errors.length < 10) errors.push(`${r.nom || id}: خطأ في الاتصال أثناء التحديث`);
        }
        setStatus(s => ({ ...s, imported, skipped, updated }));
      }

      if (updated > 0) {
        errors.push(`تم تحديث ${updated} طالب موجود (الجناح، الغرفة، المفتاح، الدفع)`);
      }

      // Count algerien vs etranger in imported records
      const importedRecs = records.slice(0, imported);
      let algerien = 0, etranger = 0;
      records.forEach(r => {
        const nat = (r.nationalite || '').toLowerCase().trim();
        if (nat.includes('algérien') || nat.includes('algerien') || nat === 'dz' || nat.includes('algérienne') || nat.includes('algerienne')) algerien++;
        else if (nat) etranger++;
      });
      saveLog((window as Window & { _importFileName?: string })._importFileName || 'fichier.xlsx', imported, updated, algerien, etranger);

      setStatus(s => ({ ...s, phase: 'done', imported, skipped, updated, errors }));
    } catch (err) {
      setStatus(s => ({ ...s, phase: 'error', errors: [translateError(String(err))] }));
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.match(/\.xlsx?$/i)) { (window as Window & { _importFileName?: string })._importFileName = file.name; processFile(file); }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { (window as Window & { _importFileName?: string })._importFileName = file.name; processFile(file); }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  const pct = status.total > 0 ? Math.round(((status.imported + status.updated) / status.total) * 100) : 0;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Import History */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
        <button onClick={() => { loadHistory(); }}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 w-full text-right">
          <History className="w-4 h-4 text-amber-500" />سجل الاستيرادات السابقة
          <ChevronDown className={`w-4 h-4 mr-auto text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
        {showHistory && (
          importLogs.length === 0 ? (
            <p className="text-xs text-slate-400 mt-3 text-center py-3">لا توجد سجلات استيراد سابقة</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="border border-slate-200 px-2 py-1.5 text-right text-amber-700">التاريخ</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-right text-amber-700">الملف</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-center text-emerald-700">جديد</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-center text-sky-700">محدّث</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-center text-slate-600">🇩🇿 جزائري</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-center text-slate-600">🌍 أجنبي</th>
                  </tr>
                </thead>
                <tbody>
                  {importLogs.map((log, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/40'}>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-600 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-500 max-w-[120px] truncate">{log.file}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-emerald-600">{log.added}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-sky-600">{log.updated}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600">{log.algerien}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600">{log.etranger}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-sky-500" />استيراد بيانات الطلبة من Excel
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={testNetwork} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <Wifi className="w-4 h-4" />اختبار الاتصال
          </button>
          {networkOk === true && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />متصل</span>}
          {networkOk === false && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />غير متصل</span>}
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600 mb-2">اسحب ملف Excel هنا أو</p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 transition-colors cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" />اختر ملف
            <input type="file" accept=".xlsx,.xls" onChange={handleInput} className="hidden" />
          </label>
          <p className="text-xs text-slate-400 mt-2">يدعم ملفات .xlsx و .xls — التعيين التلقائي للأعمدة بالعربية والفرنسية</p>
        </div>
      </div>

      {status.phase === 'reading' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-sky-500 mb-2" />
          <p className="text-sm text-slate-600">جاري قراءة الملف...</p>
        </div>
      )}

      {status.phase === 'mapping' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-sky-500" />تعيين الأعمدة المكتشفة
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(status.columnMap).map(([excel, db]) => (
              <div key={excel} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
                <span className="text-slate-600 truncate max-w-[140px]" title={excel}>{excel}</span>
                <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-medium text-emerald-700">{db}</span>
              </div>
            ))}
          </div>
          {status.unmappedHeaders.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-bold text-amber-700 mb-1">أعمدة غير معينة ({status.unmappedHeaders.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {status.unmappedHeaders.map(h => (
                  <span key={h} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(status.phase === 'importing' || status.phase === 'done') && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">
              {status.phase === 'done' ? 'اكتمل الاستيراد' : 'جاري الاستيراد...'}
            </span>
            <span className="text-sm font-bold text-sky-600">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${status.phase === 'done' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-sky-400 to-sky-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{status.imported} جديد + {status.updated} محدّث</span>
            <span>من أصل {status.total}</span>
          </div>
        </div>
      )}

      {status.phase === 'done' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <div>
              <p className="font-bold text-slate-800">تم الاستيراد بنجاح</p>
              <p className="text-sm text-slate-500">
                {status.imported} طالب جديد + {status.updated} محدّث
                {status.skipped > 0 && <span className="text-amber-600"> — {status.skipped} تم تخطيهم</span>}
              </p>
            </div>
          </div>
          {status.errors.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-700 mb-1">تحذيرات ({status.errors.length}):</p>
              {status.errors.map((e, i) => <p key={i} className="text-xs text-amber-600">{e}</p>)}
            </div>
          )}
        </div>
      )}

      {status.phase === 'error' && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="font-bold text-red-700">حدث خطأ أثناء الاستيراد</p>
          </div>
          {status.errors.map((e, i) => <p key={i} className="text-sm text-red-600 mb-1">{e}</p>)}
          <div className="mt-3 flex gap-2">
            <button onClick={testNetwork} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors">
              <Wifi className="w-4 h-4" />اختبار الاتصال
            </button>
            <button onClick={() => setStatus({ total: 0, imported: 0, updated: 0, skipped: 0, errors: [], phase: 'idle', columnMap: {}, unmappedHeaders: [] })} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {status.phase !== 'idle' && Object.keys(status.columnMap).length > 0 && status.phase !== 'mapping' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
          <h4 className="text-sm font-bold text-slate-700 mb-3">تعيين الأعمدة</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(status.columnMap).map(([excel, db]) => (
              <div key={excel} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500 truncate max-w-[120px]" title={excel}>{excel}</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium text-slate-700">{db}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
