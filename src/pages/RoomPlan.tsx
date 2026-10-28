import { useEffect, useState, useCallback } from 'react';
import { Building2, Users, ChevronDown, ChevronUp, Archive, Calendar, AlertCircle, Info } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { PAVILIONS, Pavilion, PavilionFloor, getYear } from '../lib/constants';

type RoomData = { chambre: string; students: Student[]; capacity: number };
type FloorData = { floor: PavilionFloor; rooms: RoomData[] };

function roomNumberForFloor(floor: PavilionFloor, n: number): string {
  return `${floor.prefix}${String(n).padStart(2, '0')}`;
}

// ─── Room Cell ────────────────────────────────────────────────────────────────
function RoomCell({
  room, onClick, pavColor, isArchive,
}: {
  room: RoomData; onClick: () => void; pavColor: string; isArchive: boolean;
}) {
  const occupied = room.students.length;
  const pct = room.capacity > 0 ? occupied / room.capacity : 0;

  let bg = 'bg-slate-50 border-slate-200 text-slate-300';
  if (isArchive) {
    if (occupied > 0) bg = 'bg-slate-100 border-slate-300 text-slate-400';
  } else {
    if (occupied > 0 && pct < 1) bg = 'bg-amber-50 border-amber-200 text-amber-700';
    else if (pct >= 1)           bg = 'bg-emerald-50 border-emerald-300 text-emerald-700';
  }

  const displayNum = String(parseInt(room.chambre.replace(/^.*[-_]/, ''), 10) || room.chambre);

  return (
    <button
      onClick={onClick}
      className={`border rounded-lg p-1.5 text-center transition-all cursor-pointer min-w-[60px]
        ${isArchive ? 'opacity-70 hover:opacity-100' : 'hover:shadow-md'} ${bg}`}
      title={room.students.map(s => s.nom).join('\n')}
    >
      <div className="text-xs font-bold">{displayNum}</div>
      <div className="text-xs mt-0.5">{occupied}/{room.capacity}</div>
    </button>
  );
}

// ─── Room Modal ────────────────────────────────────────────────────────────────
function RoomModal({
  room, pavColor, onClose, isArchive, archiveYear,
}: {
  room: RoomData; pavColor: string; onClose: () => void; isArchive: boolean; archiveYear?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div
          className="text-white p-4 rounded-t-2xl flex justify-between items-center"
          style={{ background: isArchive ? '#64748b' : `linear-gradient(135deg, ${pavColor}, ${pavColor}cc)` }}
        >
          <div>
            <h3 className="font-bold">غرفة {room.chambre.replace(/^PAV [A-Z]-/, '')}</h3>
            <p className="opacity-80 text-sm">
              {room.students.length} / {room.capacity} طالب
              {isArchive && archiveYear && <span className="mr-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">أرشيف {archiveYear}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">✕</button>
        </div>
        <div className="p-4" dir="rtl">
          {room.students.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">الغرفة فارغة</p>
          ) : (
            <ul className="space-y-2">
              {room.students.map(s => (
                <li key={s.id} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-800 text-sm">{s.nom}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.nationalite} — {s.niveau}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Year Selector ─────────────────────────────────────────────────────────────
function YearSelector({
  current, available, selected, onSelect,
}: {
  current: string; available: string[]; selected: string; onSelect: (y: string) => void;
}) {
  const isArchive = selected !== current;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />السنة الأكاديمية
        </h3>
        {isArchive && (
          <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            <Archive className="w-3.5 h-3.5" />عرض أرشيف
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Current year first */}
        <button
          onClick={() => onSelect(current)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            selected === current
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
          }`}
        >
          {current}
          <span className="mr-1.5 text-xs opacity-70">(الحالية)</span>
        </button>
        {/* Archive years */}
        {available.filter(y => y !== current).map(y => (
          <button
            key={y}
            onClick={() => onSelect(y)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              selected === y
                ? 'bg-slate-600 text-white border-slate-600 shadow-sm'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5 opacity-70" />{y}
          </button>
        ))}
      </div>
      {isArchive && (
        <div className="mt-3 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          أنت تعرض توزيع السنة الأكاديمية {selected} — هذا أرشيف للقراءة فقط
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RoomPlan() {
  const currentYear = getYear();

  const [selectedYear, setSelectedYear]     = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<string[]>([currentYear]);
  const [selectedPavId, setSelectedPavId]   = useState('A');
  const [floorData, setFloorData]           = useState<FloorData[]>([]);
  const [loading, setLoading]               = useState(false);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom]     = useState<RoomData | null>(null);
  const [pavOccupancy, setPavOccupancy]     = useState<Record<string, number>>({});
  const [schemaReady, setSchemaReady]       = useState<boolean | null>(null);

  const pav = PAVILIONS.find(p => p.id === selectedPavId) as Pavilion | undefined;
  const isArchive = selectedYear !== currentYear;

  // ── Check that annee column exists ──────────────────────────────────────
  useEffect(() => {
    async function checkSchema() {
      const { error } = await supabase.from('students').select('annee').limit(1);
      setSchemaReady(!error);
    }
    checkSchema();
  }, []);

  // ── Load distinct years from DB ────────────────────────────────────────
  useEffect(() => {
    async function loadYears() {
      const { data } = await supabase.from('students').select('annee');
      if (!data) return;
      const years = [...new Set(data.map(d => d.annee).filter(Boolean) as string[])].sort().reverse();
      // Always include currentYear even if no students yet
      const all = [...new Set([currentYear, ...years])];
      setAvailableYears(all);
    }
    loadYears();
  }, [currentYear]);

  // ── Load occupancy for pavilion selector ───────────────────────────────
  useEffect(() => {
    async function loadOccupancy() {
      let q = supabase.from('students').select('pavillon');
      // If annee column ready, filter by year
      if (schemaReady) q = (q as ReturnType<typeof supabase.from>).eq('annee', selectedYear) as typeof q;
      const { data } = await q;
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach(s => {
        if (s.pavillon) {
          const id = s.pavillon.replace('PAV ', '').trim();
          counts[id] = (counts[id] || 0) + 1;
        }
      });
      setPavOccupancy(counts);
    }
    if (schemaReady !== null) loadOccupancy();
  }, [selectedYear, schemaReady]);

  // ── Load floor/room data ───────────────────────────────────────────────
  const loadFloors = useCallback(async () => {
    if (!pav || schemaReady === null) return;
    setLoading(true);

    let q = supabase.from('students').select('*')
      .ilike('pavillon', `%PAV ${selectedPavId}%`)
      .eq('cle_remise', true);
    if (schemaReady) q = (q as ReturnType<typeof supabase.from>).eq('annee', selectedYear) as typeof q;
    const { data } = await q;
    const students: Student[] = data || [];

    const roomMap: Record<string, Student[]> = {};
    students.forEach(s => {
      if (!s.chambre) return;
      const numMatch = s.chambre.match(/(\d+)$/);
      if (!numMatch) return;
      const key = numMatch[1].padStart(3, '0');
      if (!roomMap[key]) roomMap[key] = [];
      if (!roomMap[key].find(x => x.id === s.id)) roomMap[key].push(s);
    });

    const floors: FloorData[] = pav.floors.map(floor => {
      const rooms: RoomData[] = [];
      for (let n = floor.start; n <= floor.end; n++) {
        const roomNum = roomNumberForFloor(floor, n);
        const chambre = `PAV ${selectedPavId}-${roomNum}`;
        rooms.push({ chambre, students: roomMap[roomNum] || [], capacity: pav.capacity });
      }
      return { floor, rooms };
    });

    setFloorData(floors);
    setExpandedFloors(new Set(pav.floors.slice(0, 2).map(f => f.name)));
    setLoading(false);
  }, [selectedPavId, selectedYear, pav, schemaReady]);

  useEffect(() => { loadFloors(); }, [loadFloors]);

  const toggleFloor = (name: string) => setExpandedFloors(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const totalRooms    = pav ? pav.floors.reduce((acc, f) => acc + (f.end - f.start + 1), 0) : 0;
  const totalOccupied = floorData.reduce((acc, f) => acc + f.rooms.reduce((a, r) => a + r.students.length, 0), 0);
  const totalEmpty    = floorData.reduce((acc, f) => acc + f.rooms.filter(r => r.students.length === 0).length, 0);
  const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / (totalRooms * (pav?.capacity || 1))) * 100) : 0;
  const sortedPavilions = [...PAVILIONS].sort((a, b) => (pavOccupancy[b.id] || 0) - (pavOccupancy[a.id] || 0));

  // ── Schema migration notice ────────────────────────────────────────────
  if (schemaReady === false) {
    return (
      <div className="max-w-xl mx-auto mt-6 p-4" dir="rtl">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">يلزم تحديث قاعدة البيانات</p>
              <p className="text-sm text-amber-700 mt-1">
                لدعم السنوات الأكاديمية المتعددة يجب إضافة حقل <code className="bg-amber-100 px-1 rounded">annee</code> لجدول الطلبة.
              </p>
            </div>
          </div>
          <pre className="text-xs bg-slate-800 text-emerald-300 rounded-lg p-3 overflow-x-auto leading-relaxed">{MIGRATION_SQL}</pre>
          <p className="text-xs text-slate-500">شغّل هذا الـ SQL في Supabase → SQL Editor ثم أعد تحميل الصفحة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">

      {/* Year Selector */}
      <YearSelector
        current={currentYear}
        available={availableYears}
        selected={selectedYear}
        onSelect={y => { setSelectedYear(y); setSelectedRoom(null); }}
      />

      {/* Pavilion Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />اختر الجناح
          <span className="text-xs text-slate-400 font-normal mr-2">(مرتبة حسب نسبة التواجد)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {sortedPavilions.map(p => {
            const count = pavOccupancy[p.id] || 0;
            const isActive = selectedPavId === p.id;
            const btnColor = isArchive ? '#64748b' : p.color;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPavId(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                  ${isActive ? 'text-white shadow-lg border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                style={isActive ? { backgroundColor: btnColor, borderColor: btnColor, boxShadow: `0 4px 14px ${btnColor}40` } : {}}
              >
                <Building2 className="w-4 h-4" />{p.name}
                <span className="pav-badge text-[10px]"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : btnColor, color: 'white' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pavilion Summary */}
      {pav && (
        <div className={`bg-white rounded-xl shadow-sm border p-4 ${isArchive ? 'border-slate-200' : 'border-amber-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {pav.name} — {pav.label}
                {isArchive && (
                  <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Archive className="w-3 h-3" />أرشيف {selectedYear}
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-500">{pav.floors.length} طوابق — {totalRooms} غرفة — سعة {pav.capacity} طالب/غرفة</p>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold" style={{ color: isArchive ? '#64748b' : pav.color }}>{totalOccupied}</p>
              <p className="text-xs text-slate-400">طالب مودَع ({occupancyRate}%)</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%`, backgroundColor: isArchive ? '#64748b' : pav.color }} />
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-50 border border-slate-200 inline-block" />فارغة ({totalEmpty})
            </span>
            {!isArchive && <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />جزئية
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 inline-block" />ممتلئة
              </span>
            </>}
            {isArchive && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />مشغولة
              </span>
            )}
          </div>
        </div>
      )}

      {/* Floors */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : floorData.map(({ floor, rooms }) => {
        const floorOccupied = rooms.reduce((a, r) => a + r.students.length, 0);
        const floorEmpty    = rooms.filter(r => r.students.length === 0).length;
        const isExpanded    = expandedFloors.has(floor.name);
        const floorBg       = isArchive ? '#64748b' : (pav?.color || '#334155');

        return (
          <div key={floor.name} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isArchive ? 'border-slate-200' : 'border-amber-100'}`}>
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
              onClick={() => toggleFloor(floor.name)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: floorBg }}>
                  {floor.prefix}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-700">{floor.name}</p>
                  <p className="text-xs text-slate-400">{rooms.length} غرفة — {floorEmpty} فارغة</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />{floorOccupied} طالب
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {rooms.map(room => (
                    <RoomCell
                      key={room.chambre}
                      room={room}
                      pavColor={pav?.color || '#334155'}
                      isArchive={isArchive}
                      onClick={() => setSelectedRoom(room)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          pavColor={pav?.color || '#334155'}
          onClose={() => setSelectedRoom(null)}
          isArchive={isArchive}
          archiveYear={isArchive ? selectedYear : undefined}
        />
      )}
    </div>
  );
}

// ─── Migration SQL ────────────────────────────────────────────────────────────
const MIGRATION_SQL = `-- أضف حقل السنة الأكاديمية (مرة واحدة فقط)
ALTER TABLE students ADD COLUMN IF NOT EXISTS annee text NOT NULL DEFAULT '';

-- أنشئ فهرساً للبحث السريع
CREATE INDEX IF NOT EXISTS students_annee_idx ON students(annee);

-- طلبة بدون سنة → خصص لهم السنة الافتراضية 2025/2026
UPDATE students SET annee = '2025/2026' WHERE annee = '';`;
