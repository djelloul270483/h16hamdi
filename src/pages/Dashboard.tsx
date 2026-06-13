import { useEffect, useState } from 'react';
import { Users, Home, CreditCard, Key, Globe, Building, GraduationCap, TrendingUp } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { PAVILIONS } from '../lib/constants';

interface Stats {
  total: number;
  paid: number;
  unpaid: number;
  keyGiven: number;
  byPavilion: Record<string, number>;
  byNationality: Array<{ name: string; count: number }>;
  byLevel: Array<{ name: string; count: number }>;
  byEtablissement: Array<{ name: string; count: number }>;
  bySexe: Record<string, number>;
  // Categories
  nouveaux: number;
  deuxiemePhase: number;
  anciens: number;
  algeriens: number;
  etrangers: number;
  // Per-category breakdown
  nouveauxAlg: number; nouveauxEtr: number;
  masterAlg: number;   masterEtr: number;
  anciensAlg: number;  anciensEtr: number;
}

function StatCard({ icon: Icon, label, value, sub, gradient }: { icon: React.ElementType; label: string; value: number | string; sub?: string; gradient: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString('fr-DZ') : value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color, badge }: { label: string; value: number; max: number; color: string; badge?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{label}</span>
        <div className="flex items-center gap-2">
          {badge && <span className="pav-badge" style={{ backgroundColor: color }}>{badge}</span>}
          <span className="text-sm font-bold text-slate-600 mr-2">{value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('students').select('*');
        if (error || !data) { setLoading(false); return; }
        const students: Student[] = data;

      const byPavilion: Record<string, number> = {};
      const nationalityMap: Record<string, number> = {};
      const levelMap: Record<string, number> = {};
      const etabMap: Record<string, number> = {};
      const sexeMap: Record<string, number> = {};

      let nouveaux = 0, deuxiemePhase = 0, anciens = 0, algeriens = 0, etrangers = 0;
      let nouveauxAlg = 0, nouveauxEtr = 0, masterAlg = 0, masterEtr = 0, anciensAlg = 0, anciensEtr = 0;

      students.forEach(s => {
        const pav = s.pavillon?.replace('PAV ', '') || 'غير محدد';
        byPavilion[pav] = (byPavilion[pav] || 0) + 1;
        if (s.nationalite) nationalityMap[s.nationalite] = (nationalityMap[s.nationalite] || 0) + 1;
        if (s.niveau) levelMap[s.niveau] = (levelMap[s.niveau] || 0) + 1;
        if (s.etablissement) etabMap[s.etablissement] = (etabMap[s.etablissement] || 0) + 1;
        if (s.sexe) sexeMap[s.sexe] = (sexeMap[s.sexe] || 0) + 1;

        // Nationality detection
        const nat = (s.nationalite || '').toLowerCase().trim();
        const isAlg = nat.includes('algérien') || nat.includes('algerien') || nat === 'dz'
          || nat.includes('algérienne') || nat.includes('algerienne') || nat === 'algerie' || nat === 'algérie';
        if (isAlg) algeriens++; else etrangers++;

        // Student category — strict master detection
        const niv = (s.niveau || '').toLowerCase().trim();
        // Master: must explicitly contain "master", "m1", "m2" — NOT "l2", "l3" etc.
        const isMaster = /master|m1|m2|magistere|magistère/.test(niv) && !niv.startsWith('l');
        // 1st year: l1, licence 1, 1ère année, première année
        const isFirst = /^l1$|^lmd ?1$|1.?ère|1.?ere|première année|premiere annee|^1$/.test(niv)
          || (niv.startsWith('l1') && !niv.startsWith('l2') && !niv.startsWith('l3'));

        if (isFirst)        { nouveaux++;       isAlg ? nouveauxAlg++ : nouveauxEtr++; }
        else if (isMaster)  { deuxiemePhase++;  isAlg ? masterAlg++   : masterEtr++;   }
        else                { anciens++;         isAlg ? anciensAlg++  : anciensEtr++;  }
      });

      setStats({
        total: students.length,
        paid: students.filter(s => s.paiement_hebergement).length,
        unpaid: students.filter(s => !s.paiement_hebergement).length,
        keyGiven: students.filter(s => s.cle_remise).length,
        byPavilion,
        byNationality: Object.entries(nationalityMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        byLevel: Object.entries(levelMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        byEtablissement: Object.entries(etabMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
        bySexe: sexeMap,
        nouveaux, deuxiemePhase, anciens, algeriens, etrangers,
        nouveauxAlg, nouveauxEtr, masterAlg, masterEtr, anciensAlg, anciensEtr,
      });
      setLoading(false);
    } catch {
      setLoading(false);
    }
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" /></div>;

  if (!stats || stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">لا توجد بيانات</p>
        <p className="text-sm">قم باستيراد ملف Excel لعرض الإحصائيات</p>
      </div>
    );
  }

  const payRate = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

  // Sort pavilions by occupancy percentage (descending)
  const sortedPavilions = [...PAVILIONS].sort((a, b) => {
    const countA = stats.byPavilion[a.id] || 0;
    const countB = stats.byPavilion[b.id] || 0;
    const pctA = stats.total > 0 ? countA / stats.total : 0;
    const pctB = stats.total > 0 ? countB / stats.total : 0;
    return pctB - pctA;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="إجمالي الطلبة" value={stats.total} sub="طالب مسجل" gradient="from-amber-500 to-amber-600" />
        <StatCard icon={CreditCard} label="سددوا الإيواء" value={stats.paid} sub={`${payRate}% من الإجمالي`} gradient="from-emerald-500 to-emerald-600" />
        <StatCard icon={Home} label="لم يسددوا بعد" value={stats.unpaid} sub={`${100 - payRate}% من الإجمالي`} gradient="from-red-400 to-red-500" />
        <StatCard icon={Key} label="تسلموا المفتاح" value={stats.keyGiven} sub="مفتاح سُلّم" gradient="from-sky-500 to-sky-600" />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-600" />نسبة تسديد مستحقات الإيواء
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-l from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${payRate}%` }} />
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{payRate}%</span>
        </div>
        <div className="flex gap-6 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />سدد: {stats.paid}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />لم يسدد: {stats.unpaid}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Building className="w-4 h-4 text-amber-600" />توزيع حسب الأجنحة</h3>
          {sortedPavilions.map(pav => (
            <ProgressBar
              key={pav.id}
              label={`${pav.name} — ${pav.label}`}
              value={stats.byPavilion[pav.id] || 0}
              max={stats.total}
              color={pav.color}
              badge={pav.id}
            />
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-amber-600" />توزيع حسب الجنسية</h3>
          {stats.byNationality.map(({ name, count }) => <ProgressBar key={name} label={name} value={count} max={stats.total} color="#0ea5e9" />)}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-amber-600" />توزيع حسب المستوى</h3>
          {stats.byLevel.map(({ name, count }) => <ProgressBar key={name} label={name} value={count} max={stats.total} color="#10b981" />)}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Building className="w-4 h-4 text-amber-600" />توزيع حسب المؤسسة</h3>
          {stats.byEtablissement.map(({ name, count }) => <ProgressBar key={name} label={name} value={count} max={stats.total} color="#b8860b" />)}
        </div>
      </div>

      {Object.keys(stats.bySexe).length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4">توزيع حسب الجنس</h3>
          <div className="flex gap-6">
            {Object.entries(stats.bySexe).map(([sexe, count]) => (
              <div key={sexe} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${sexe === 'Garçon' ? 'bg-gradient-to-br from-sky-400 to-sky-600' : 'bg-gradient-to-br from-pink-400 to-pink-500'}`}>
                  {sexe === 'Garçon' ? '♂' : '♀'}
                </div>
                <div><p className="text-lg font-bold text-slate-700">{count}</p><p className="text-xs text-slate-500">{sexe === 'Garçon' ? 'ذكر' : 'أنثى'}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Categories */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-600" />تصنيف الطلبة حسب الطور والجنسية
        </h3>

        {/* Global algerian/foreign */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-xl p-3 bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200">
            <span className="text-2xl">🇩🇿</span>
            <div>
              <div className="text-xl font-bold text-emerald-700">{stats.algeriens.toLocaleString('fr-DZ')}</div>
              <div className="text-xs text-emerald-600">جزائريون</div>
            </div>
            <div className="mr-auto text-xs text-slate-400">{stats.total > 0 ? Math.round(stats.algeriens/stats.total*100) : 0}%</div>
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3 bg-gradient-to-l from-sky-50 to-blue-50 border border-sky-200">
            <span className="text-2xl">🌍</span>
            <div>
              <div className="text-xl font-bold text-sky-700">{stats.etrangers.toLocaleString('fr-DZ')}</div>
              <div className="text-xs text-sky-600">أجانب</div>
            </div>
            <div className="mr-auto text-xs text-slate-400">{stats.total > 0 ? Math.round(stats.etrangers/stats.total*100) : 0}%</div>
          </div>
        </div>

        {/* Per-category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* طلبة جدد */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{stats.nouveaux.toLocaleString('fr-DZ')}</div>
            <div className="text-sm font-semibold text-emerald-700 mt-0.5">طلبة جدد</div>
            <div className="text-xs text-emerald-500 mt-0.5">السنة الأولى — 1ère année</div>
            <div className="mt-2 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.total > 0 ? Math.round(stats.nouveaux/stats.total*100) : 0}%` }} />
            </div>
            <div className="text-xs text-emerald-600 mt-1 mb-2">{stats.total > 0 ? Math.round(stats.nouveaux/stats.total*100) : 0}% من الإجمالي</div>
            <div className="flex gap-2 pt-2 border-t border-emerald-200">
              <div className="flex-1 bg-white/60 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-emerald-700">🇩🇿 {stats.nouveauxAlg}</div>
                <div className="text-[10px] text-emerald-600">جزائري</div>
              </div>
              <div className="flex-1 bg-white/60 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-sky-600">🌍 {stats.nouveauxEtr}</div>
                <div className="text-[10px] text-sky-500">أجنبي</div>
              </div>
            </div>
          </div>

          {/* الطور الثاني - ماستر */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200">
            <div className="text-2xl font-bold text-sky-700">{stats.deuxiemePhase.toLocaleString('fr-DZ')}</div>
            <div className="text-sm font-semibold text-sky-700 mt-0.5">الطور الثاني</div>
            <div className="text-xs text-sky-500 mt-0.5">ماستر فقط — Master 1 & 2</div>
            <div className="mt-2 h-1.5 bg-sky-200 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${stats.total > 0 ? Math.round(stats.deuxiemePhase/stats.total*100) : 0}%` }} />
            </div>
            <div className="text-xs text-sky-600 mt-1 mb-2">{stats.total > 0 ? Math.round(stats.deuxiemePhase/stats.total*100) : 0}% من الإجمالي</div>
            <div className="flex gap-2 pt-2 border-t border-sky-200">
              <div className="flex-1 bg-white/60 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-emerald-700">🇩🇿 {stats.masterAlg}</div>
                <div className="text-[10px] text-emerald-600">جزائري</div>
              </div>
              <div className="flex-1 bg-white/60 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-sky-600">🌍 {stats.masterEtr}</div>
                <div className="text-[10px] text-sky-500">أجنبي</div>
              </div>
            </div>
          </div>

          {/* طلبة قدامى */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{stats.anciens.toLocaleString('fr-DZ')}</div>
            <div className="text-sm font-semibold text-amber-700 mt-0.5">طلبة قدامى</div>
            <div className="text-xs text-amber-500 mt-0.5">L2 ، L3 وسنوات أخرى</div>
            <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.total > 0 ? Math.round(stats.anciens/stats.total*100) : 0}%` }} />
            </div>
            <div className="text-xs text-amber-600 mt-1 mb-2">{stats.total > 0 ? Math.round(stats.anciens/stats.total*100) : 0}% من الإجمالي</div>
            <div className="flex gap-2 pt-2 border-t border-amber-200">
              <div className="flex-1 bg-white/60 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-emerald-700">🇩🇿 {stats.anciensAlg}</div>
                <div className="text-[10px] text-emerald-600">جزائري</div>
              </div>
              <div className="flex-1 bg-white/60 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-sky-600">🌍 {stats.anciensEtr}</div>
                <div className="text-[10px] text-sky-500">أجنبي</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
