import { ReactNode, useState, useEffect } from 'react';
import {
  Home, Users, Map, FileText, FileCheck, Upload, Search,
  Menu, X, Building2, ChevronRight, Calendar, Clock, Pencil, Check, Wifi, WifiOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getYear, setYear } from '../lib/constants';

type Page = 'dashboard' | 'students' | 'plan' | 'housing-cert' | 'clearance-cert' | 'import' | 'search' | 'inventory';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'لوحة الإحصائيات', labelFr: 'Tableau de bord', icon: Home },
  { id: 'students' as Page, label: 'قائمة الطلبة', labelFr: 'Liste des étudiants', icon: Users },
  { id: 'plan' as Page, label: 'مخطط الإيواء', labelFr: "Plan d'hébergement", icon: Map },
  { id: 'inventory' as Page, label: 'بطاقات الجرد', labelFr: 'Inventaire des chambres', icon: Building2 },
  { id: 'housing-cert' as Page, label: 'شهادة الإيواء', labelFr: "Attestation d'hébergement", icon: FileText },
  { id: 'clearance-cert' as Page, label: 'شهادة التبرئة', labelFr: 'Attestation de décharge', icon: FileCheck },
  { id: 'import' as Page, label: 'استيراد البيانات', labelFr: 'Importer données', icon: Upload },
  { id: 'search' as Page, label: 'بحث سريع', labelFr: 'Recherche rapide', icon: Search },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-amber-500" />
        {dateStr}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        {timeStr}
      </span>
    </div>
  );
}

function YearBadge() {
  const [year, setLocalYear] = useState(getYear());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(year);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed.includes('/')) {
      setYear(trimmed);
      setLocalYear(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="w-20 text-xs text-slate-700 bg-white border border-amber-200 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
          autoFocus
        />
        <button onClick={save} className="p-0.5 hover:bg-amber-100 rounded text-emerald-600">
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(year); setEditing(true); }}
      className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors border border-amber-200 group"
      title="انقر لتغيير السنة الدراسية"
    >
      <Calendar className="w-3.5 h-3.5" />
      <span className="font-semibold">{year}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

function NetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const { error } = await supabase.from('students').select('id').limit(1);
        setOnline(!error);
      } catch {
        setOnline(false);
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (online) return null;

  return (
    <div className="bg-red-500 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 print:hidden">
      <WifiOff className="w-3.5 h-3.5" />
      <span>غير متصل بقاعدة البيانات — تحقق من اتصال الإنترنت</span>
    </div>
  );
}

export default function Layout({ currentPage, onNavigate, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/20 flex" dir="rtl">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300 fixed top-0 bottom-0 right-0 z-30 overflow-hidden`}
      >
        <div className="p-4 border-b border-amber-700/30">
          {sidebarOpen ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white leading-tight">الإقامة الجامعية</span>
              </div>
              <p className="text-xs text-amber-400/80 pr-10">عين الباي 16 - قسنطينة</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ id, label, labelFr, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-l from-amber-600/90 to-amber-700/90 text-white shadow-lg shadow-amber-900/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{label}</div>
                    <div className={`text-xs truncate ${active ? 'text-amber-200/70' : 'text-slate-500'}`}>{labelFr}</div>
                  </div>
                )}
                {sidebarOpen && active && <ChevronRight className="w-4 h-4 shrink-0 text-amber-200" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-amber-700/30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:mr-64' : 'md:mr-16'} mr-0`}>
        <NetworkStatus />
        <header className="bg-white/80 backdrop-blur-md border-b border-amber-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-800">
                {navItems.find(n => n.id === currentPage)?.label}
              </h1>
              <p className="text-xs text-amber-600">
                {navItems.find(n => n.id === currentPage)?.labelFr}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveClock />
            <YearBadge />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
