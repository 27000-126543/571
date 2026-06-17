import { useState } from 'react';
import Layout from '../components/Layout';
import { LibraryScene } from '../components/scenes3d';
import {
  Library,
  CalendarClock,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  BookOpen,
  Users as UsersIcon,
  Coffee,
  Sun,
} from 'lucide-react';
import type { LibrarySeat, SeatStatus } from '../../shared/types';

type ZoneType = 'A' | 'B' | 'C' | 'D';

const zones: { key: ZoneType; name: string; desc: string; icon: typeof BookOpen }[] = [
  { key: 'A', name: 'A安静区', desc: '静音自习，专注学习', icon: BookOpen },
  { key: 'B', name: 'B讨论区', desc: '小组讨论，项目协作', icon: UsersIcon },
  { key: 'C', name: 'C电子阅览区', desc: '电脑设备，数字资源', icon: Coffee },
  { key: 'D', name: 'D靠窗区', desc: '自然采光，景观座位', icon: Sun },
];

const generateSeats = (zone: ZoneType): LibrarySeat[] => {
  const seats: LibrarySeat[] = [];
  const statuses: SeatStatus[] = ['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE'];
  const rows = 5;
  const cols = 8;
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (zone.charCodeAt(0) * 31 + r * 7 + c * 13) % 10;
      let status: SeatStatus;
      if (seed < 5) status = 'AVAILABLE';
      else if (seed < 7) status = 'IN_USE';
      else if (seed < 9) status = 'RESERVED';
      else status = 'MAINTENANCE';
      
      seats.push({
        id: `${zone}-${r}-${c}`,
        seatNumber: `${zone}${String(r * cols + c + 1).padStart(3, '0')}`,
        zone: `${zone}${zone === 'A' ? '安静区' : zone === 'B' ? '讨论区' : zone === 'C' ? '电子阅览区' : '靠窗区'}` as LibrarySeat['zone'],
        status,
        position3D: { x: c, y: 0, z: r },
        usedMinutesToday: Math.floor(Math.random() * 300),
        ...(status === 'RESERVED' && {
          currentStudentName: ['张三', '李四', '王五', '赵六'][idx % 4],
          reservedUntil: new Date(Date.now() + Math.random() * 3600000).toISOString(),
        }),
        ...(status === 'IN_USE' && {
          currentStudentName: ['学生' + (idx + 1), '同学' + (idx + 10)][idx % 2],
          checkedInAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        }),
      });
      idx++;
    }
  }
  return seats;
};

const statusConfig: Record<SeatStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  AVAILABLE: {
    label: '空闲',
    bg: 'bg-success/20',
    border: 'border-success/40',
    text: 'text-success hover:bg-success/30',
    dot: 'bg-success',
  },
  RESERVED: {
    label: '已预约',
    bg: 'bg-warning/20',
    border: 'border-warning/40',
    text: 'text-warning hover:bg-warning/30',
    dot: 'bg-warning',
  },
  IN_USE: {
    label: '使用中',
    bg: 'bg-danger/20',
    border: 'border-danger/40',
    text: 'text-danger hover:bg-danger/30',
    dot: 'bg-danger',
  },
  MAINTENANCE: {
    label: '维护',
    bg: 'bg-gray-700/50',
    border: 'border-gray-600',
    text: 'text-gray-500 cursor-not-allowed',
    dot: 'bg-gray-500',
  },
};

export default function LibraryPage() {
  const [activeZone, setActiveZone] = useState<ZoneType>('A');
  const [seats] = useState<Record<ZoneType, LibrarySeat[]>>({
    A: generateSeats('A'),
    B: generateSeats('B'),
    C: generateSeats('C'),
    D: generateSeats('D'),
  });
  const [selectedSeat, setSelectedSeat] = useState<LibrarySeat | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [reserveTimeSlot, setReserveTimeSlot] = useState('2h');

  const currentSeats = seats[activeZone].filter((s) =>
    searchText ? s.seatNumber.toLowerCase().includes(searchText.toLowerCase()) : true
  );

  const stats = {
    total: seats[activeZone].length,
    available: seats[activeZone].filter(s => s.status === 'AVAILABLE').length,
    inUse: seats[activeZone].filter(s => s.status === 'IN_USE').length,
    reserved: seats[activeZone].filter(s => s.status === 'RESERVED').length,
  };

  const handleSelectSeat = (seat: LibrarySeat) => {
    setSelectedSeat(seat);
  };

  const handleReserve = (seat: LibrarySeat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelectedSeat(seat);
    setShowReserveModal(true);
  };

  const timeSlots = [
    { value: '1h', label: '1小时' },
    { value: '2h', label: '2小时' },
    { value: '3h', label: '3小时' },
    { value: '4h', label: '4小时' },
    { value: 'allday', label: '全天' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Library className="w-7 h-7 text-warning" />
              图书馆座位管理
            </h2>
            <p className="text-gray-500 mt-1">座位预约、实时状态监控、学习行为分析</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索座位号..."
              className="pl-10 pr-4 py-2.5 rounded-xl bg-bg-card border border-bg-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const zoneStats = {
              total: seats[zone.key].length,
              available: seats[zone.key].filter(s => s.status === 'AVAILABLE').length,
            };
            const isActive = activeZone === zone.key;
            return (
              <button
                key={zone.key}
                onClick={() => setActiveZone(zone.key)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-warning/20 to-primary/15 border-warning/40 shadow-lg shadow-warning/10'
                    : 'bg-bg-card border-bg-border hover:border-warning/30 card-hover'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl ${isActive ? 'bg-warning/30' : 'bg-bg-lighter'} flex items-center justify-center`}>
                    <zone.icon className={`w-6 h-6 ${isActive ? 'text-warning' : 'text-gray-400'}`} />
                  </div>
                  {isActive && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-warning/20 text-warning">当前</span>
                  )}
                </div>
                <div className={`font-bold mb-1 ${isActive ? 'text-warning' : ''}`}>{zone.name}</div>
                <div className="text-xs text-gray-500 mb-3">{zone.desc}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success font-medium">{zoneStats.available} 空闲</span>
                  <span className="text-gray-500">/ {zoneStats.total} 座</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700/50" style={{ height: 'calc(100vh - 160px)' }}>
              <LibraryScene
                seats={currentSeats}
                highlightedIds={selectedSeat ? [selectedSeat.id] : []}
                onSelectSeat={handleSelectSeat}
              />
            </div>
          </div>

          <div className="w-80 space-y-6 flex-shrink-0">
            <div className="rounded-2xl bg-bg-card border border-bg-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">区域统计</h3>
                <span className="text-xs text-gray-500">{zones.find(z => z.key === activeZone)?.name}</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: '空闲座位', value: stats.available, total: stats.total, color: 'success' },
                  { label: '使用中', value: stats.inUse, total: stats.total, color: 'danger' },
                  { label: '已预约', value: stats.reserved, total: stats.total, color: 'warning' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className={`text-sm font-bold text-${item.color}`}>
                        {item.value} / {item.total}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-lighter overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-${item.color} progress-bar`}
                        style={{ width: `${(item.value / item.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSeat && (
              <div className="rounded-2xl bg-bg-card border border-success/30 p-5 shadow-lg shadow-success/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-success flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    座位详情
                  </h3>
                </div>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between py-2 border-b border-bg-border/50">
                    <span className="text-gray-500 text-sm">座位号</span>
                    <span className="font-medium">{selectedSeat.seatNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-bg-border/50">
                    <span className="text-gray-500 text-sm">区域</span>
                    <span className="font-medium">{selectedSeat.zone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-bg-border/50">
                    <span className="text-gray-500 text-sm">状态</span>
                    <span className={`badge ${statusConfig[selectedSeat.status].text.replace('hover:', '')}`}>
                      {statusConfig[selectedSeat.status].label}
                    </span>
                  </div>
                  {selectedSeat.status === 'IN_USE' && selectedSeat.currentStudentName && (
                    <div className="flex justify-between py-2 border-b border-bg-border/50">
                      <span className="text-gray-500 text-sm">当前使用</span>
                      <span className="font-medium">{selectedSeat.currentStudentName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 text-sm">今日使用时长</span>
                    <span className="font-medium text-primary-300">
                      {Math.floor(selectedSeat.usedMinutesToday / 60)}h {selectedSeat.usedMinutesToday % 60}m
                    </span>
                  </div>
                </div>
                {selectedSeat.status === 'AVAILABLE' && (
                  <button
                    onClick={() => setShowReserveModal(true)}
                    className="w-full py-3 rounded-xl btn-success text-white font-medium flex items-center justify-center gap-2"
                  >
                    <CalendarClock className="w-5 h-5" />
                    立即预约
                  </button>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-bg-card border border-bg-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <h3 className="font-semibold">我的预约</h3>
                  <p className="text-xs text-gray-500">最近预约记录</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { seat: 'A023', time: '14:00 - 17:00', status: '即将开始', type: 'success' },
                  { seat: 'B012', time: '昨天 09:00', status: '已完成', type: 'primary' },
                  { seat: 'C005', time: '前天 18:00', status: '已取消', type: 'danger' },
                ].map((record, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg-light/50 border border-bg-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">座位 {record.seat}</span>
                      <span className={`badge badge-${record.type}`}>{record.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {record.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReserveModal && selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-bg-card border border-bg-border p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success/20 flex items-center justify-center">
                <CalendarClock className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-1">预约座位确认</h3>
              <p className="text-gray-500 text-sm">请选择预约时间段</p>
            </div>
            
            <div className="space-y-3 mb-6 p-4 rounded-xl bg-bg-light/50">
              <div className="flex justify-between">
                <span className="text-gray-500">座位号</span>
                <span className="font-semibold text-success">{selectedSeat.seatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">区域</span>
                <span>{selectedSeat.zone}</span>
              </div>
              <div className="pt-3 border-t border-bg-border/50">
                <div className="text-gray-500 text-sm mb-3">选择时间段</div>
                <div className="grid grid-cols-5 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      onClick={() => setReserveTimeSlot(slot.value)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        reserveTimeSlot === slot.value
                          ? 'bg-success text-white'
                          : 'bg-bg-lighter text-gray-400 hover:text-white hover:bg-bg-light'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning/90">
                预约成功后请在15分钟内签到，否则座位将被自动释放。
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReserveModal(false);
                  setSelectedSeat(null);
                }}
                className="flex-1 py-3 rounded-xl bg-bg-lighter border border-bg-border text-gray-400 font-medium hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowReserveModal(false);
                  setSelectedSeat(null);
                }}
                className="flex-1 py-3 rounded-xl btn-success text-white font-medium"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
