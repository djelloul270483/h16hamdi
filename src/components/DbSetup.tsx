import { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle, Loader, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SQL = `CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nin text, code_photo text, annee_bac integer,
  matricule_bac text, wilaya_bac text, numero_inscription text,
  nom text NOT NULL DEFAULT '', date_naissance date,
  sexe text DEFAULT '', nationalite text DEFAULT '',
  residence text DEFAULT '', pavillon text DEFAULT '',
  chambre text DEFAULT '', commune text DEFAULT '',
  etablissement text DEFAULT '', domaine text DEFAULT '',
  filiere text DEFAULT '', niveau text DEFAULT '',
  frais_inscription_paye boolean DEFAULT false,
  paiement_hebergement boolean DEFAULT false,
  cle_remise boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS students_nom_idx ON students(nom);
CREATE INDEX IF NOT EXISTS students_pavillon_idx ON students(pavillon);
CREATE INDEX IF NOT EXISTS students_paiement_idx ON students(paiement_hebergement);

CREATE TABLE IF NOT EXISTS room_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  pavillon text NOT NULL DEFAULT '', chambre text NOT NULL DEFAULT '',
  matelas integer DEFAULT 1, couverture integer DEFAULT 1,
  drap integer DEFAULT 2, oreiller integer DEFAULT 1,
  taie_oreiller integer DEFAULT 1, chaise integer DEFAULT 1,
  bureau integer DEFAULT 1, armoire integer DEFAULT 1,
  notes text DEFAULT '', date_entree date, date_sortie date,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE room_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_inv" ON room_inventory FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_inv" ON room_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

interface Props {
  onReady: () => void;
}

export default function DbSetup({ onReady }: Props) {
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function check() {
      const { error } = await supabase.from('students').select('id').limit(1);
      if (!error) onReady();
      else setChecking(false);
    }
    check();
  }, [onReady]);

  async function recheck() {
    setChecking(true);
    const { error } = await supabase.from('students').select('id').limit(1);
    if (!error) onReady();
    else setChecking(false);
  }

  function copySQL() {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
          <p className="text-slate-600">جاري التحقق من قاعدة البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-2xl w-full overflow-hidden">
        <div className="bg-slate-800 text-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-sky-400" />
            <div>
              <h1 className="text-xl font-bold">الإقامة الجامعية عين الباي 16</h1>
              <p className="text-slate-300 text-sm">إعداد قاعدة البيانات</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">قاعدة البيانات تحتاج إلى إعداد</p>
              <p className="text-sm text-amber-700 mt-1">يجب تشغيل سكريبت SQL لإنشاء جداول البيانات قبل استخدام التطبيق.</p>
            </div>
          </div>

          <h3 className="font-bold text-slate-700 mb-2">الخطوات:</h3>
          <ol className="space-y-2 mb-5">
            {[
              'اذهب إلى لوحة تحكم Supabase الخاصة بك',
              'افتح قسم "SQL Editor"',
              'انسخ الكود أدناه والصقه في المحرر',
              'اضغط على "Run" لتنفيذ الأوامر',
              'عد هنا واضغط "التحقق مجدداً"',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            <div className="flex items-center justify-between bg-slate-100 px-3 py-2">
              <span className="text-xs text-slate-500 font-mono">SQL</span>
              <button onClick={copySQL} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
            <pre className="text-xs text-slate-700 p-3 overflow-auto max-h-48 bg-white font-mono leading-relaxed">{SQL}</pre>
          </div>

          <button onClick={recheck} className="w-full py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors">
            التحقق مجدداً
          </button>
        </div>
      </div>
    </div>
  );
}
