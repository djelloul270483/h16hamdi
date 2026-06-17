import { useEffect, useState } from 'react';
import { Building2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { PAVILIONS, Pavilion, PavilionFloor } from '../lib/constants';

type RoomData = { chambre: string; students: Student[]; capacity: number };
type FloorData = { floor: PavilionFloor; rooms: RoomData[] };

function roomNumberForFloor(floor: PavilionFloor, n: number): string {
  const prefix = floor.prefix;
  const suffix = String(n).padStart(2, '0');
  return `${prefix}${suffix}`;
}

function RoomCell({ room, onClick, pavColor }: { room: RoomData; onClick: () => void; pavColor: string }) {
  const occupied = room.students.length;
  const pct = room.capacity > 0 ? occupied / room.capacity : 0;
  let bg = 'bg-slate-50 border-slate-200 text-slate-300';
  if (occupied > 0 && pct < 1) bg = 'bg-amber-50 border-amber-200 text-amber-700';
  else if (pct >= 1) bg = 'bg-emerald-50 border-emerald-300 text-emerald-700';

  const displayNum = String(parseInt(room.chambre.replace(/^.*[-_]/, ''), 10) || room.chambre);

  return (
    <button onClick={onClick} className={`border rounded-lg p-1.5 text-center hover:shadow-md transition-all cursor-pointer min-w-[60px] ${bg}`} title={room.students.map(s => s.nom).join('\n')}>
      <div className="text-xs font-bold">{displayNum}</div>
      <div className="text-xs mt-0.5">{occupied}/{room.capacity}</div>
    </button>
  );
}

function RoomModal({ room, pavColor, onClose }: { room: RoomData; pavColor: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="text-white p-4 rounded-t-2xl flex justify-between items-center" style={{ background: `linear-gradient(135deg, ${pavColor}, ${pavColor}cc)` }}>
          <div><h3 className="font-bold">غرفة {room.chambre}</h3><p className="opacity-80 text-sm">{room.students.length} / {room.capacity} طالب</p></div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">✕</button>
        </div>
        <div className="p-4" dir="rtl">
          {room.students.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">الغرفة فارغة</p> : (
            <ul className="space-y-2">{room.students.map(s => (
              <li key={s.id} className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-800 text-sm">{s.nom}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.nationalite} - {s.niveau}</p>
              </li>
            ))}</ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomPlan() {
  const [selectedPavId, setSelectedPavId] = useState('A');
  const [floorData, setFloorData] = useState<FloorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);

  const pav = PAVILIONS.find(p => p.id === selectedPavId) as Pavilion | undefined;
  const totalRooms = pav ? pav.floors.reduce((acc, f) => acc + (f.end - f.start + 1), 0) : 0;

  useEffect(() => {
    async function load() {
      if (!pav) return;
      setLoading(true);
      const { data } = await supabase.from('students').select('*').ilike('pavillon', `%PAV ${selectedPavId}%`);
      const students: Student[] = data || [];

      // Build roomMap using FULL 3-digit room number as key
      // e.g., "PAV F-001" → "001", "PAV F-201" → "201", "1" → "001", "201" → "201"
      const roomMap: Record<string, Student[]> = {};

      students.forEach(s => {
        if (!s.chambre) return;
        const numMatch = s.chambre.match(/(\d+)$/);
        if (!numMatch) return;
        const raw = numMatch[1];
        // Pad to 3 digits to match roomNumberForFloor format (e.g. "1"→"001", "201"→"201")
        const key = raw.padStart(3, '0');
        if (!roomMap[key]) roomMap[key] = [];
        if (!roomMap[key].find(x => x.id === s.id)) roomMap[key].push(s);
      });

      const floors: FloorData[] = pav.floors.map(floor => {
        const rooms: RoomData[] = [];
        for (let n = floor.start; n <= floor.end; n++) {
          const roomNum = roomNumberForFloor(floor, n);
          const chambreDash = `PAV ${selectedPavId}-${roomNum}`;
          // Use full room number as key (matches student chambre normalization)
          // e.g. "001", "201"
          const students = roomMap[roomNum] || [];
          rooms.push({ chambre: chambreDash, students, capacity: pav.capacity });
        }
        return { floor, rooms };
      });

      setFloorData(floors);
      setExpandedFloors(new Set(pav.floors.slice(0, 2).map(f => f.name)));
      setLoading(false);
    }
    load();
  }, [selectedPavId, pav]);

  const toggleFloor = (name: string) => setExpandedFloors(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const totalOccupied = floorData.reduce((acc, f) => acc + f.rooms.reduce((a, r) => a + r.students.length, 0), 0);
  const totalEmpty = floorData.reduce((acc, f) => acc + f.rooms.filter(r => r.students.length === 0).length, 0);
  const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / (totalRooms * (pav?.capacity || 1))) * 100) : 0;

  // Sort pavilions by occupancy for the selector
  const [pavOccupancy, setPavOccupancy] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadOccupancy() {
      const { data } = await supabase.from('students').select('pavillon');
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
    loadOccupancy();
  }, []);

  const sortedPavilions = [...PAVILIONS].sort((a, b) => (pavOccupancy[b.id] || 0) - (pavOccupancy[a.id] || 0));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />اختر الجناح
          <span className="text-xs text-slate-400 font-normal mr-2">(مرتبة حسب نسبة التواجد)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {sortedPavilions.map(p => {
            const count = pavOccupancy[p.id] || 0;
            const isActive = selectedPavId === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPavId(p.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${isActive ? 'text-white shadow-lg border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`} style={isActive ? { backgroundColor: p.color, borderColor: p.color, boxShadow: `0 4px 14px ${p.color}40` } : {}}>
                <Building2 className="w-4 h-4" />{p.name}
                <span className="pav-badge text-[10px]" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : p.color, color: isActive ? 'white' : 'white' }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pav && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{pav.name} — {pav.label}</h2>
              <p className="text-sm text-slate-500">{pav.floors.length} طوابق - {totalRooms} غرفة - سعة {pav.capacity} طالب/غرفة</p>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold" style={{ color: pav.color }}>{totalOccupied}</p>
              <p className="text-xs text-slate-400">طالب مودَع ({occupancyRate}%)</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%`, backgroundColor: pav.color }} />
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-200 inline-block" />فارغة ({totalEmpty})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />جزئية</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 inline-block" />ممتلئة</span>
          </div>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
      : floorData.map(({ floor, rooms }) => {
        const floorOccupied = rooms.reduce((a, r) => a + r.students.length, 0);
        const floorEmpty = rooms.filter(r => r.students.length === 0).length;
        const isExpanded = expandedFloors.has(floor.name);
        return (
          <div key={floor.name} className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-amber-50/30 transition-colors" onClick={() => toggleFloor(floor.name)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: pav?.color || '#334155' }}>
                  {floor.prefix}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-700">{floor.name}</p>
                  <p className="text-xs text-slate-400">{rooms.length} غرفة - {floorEmpty} فارغة</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-600"><Users className="w-4 h-4 text-slate-400" />{floorOccupied} طالب</div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {rooms.map(room => <RoomCell key={room.chambre} room={room} pavColor={pav?.color || '#334155'} onClick={() => setSelectedRoom(room)} />)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selectedRoom && <RoomModal room={selectedRoom} pavColor={pav?.color || '#334155'} onClose={() => setSelectedRoom(null)} />}
    </div>
  );
}
