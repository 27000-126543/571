import { useState } from 'react';
import Layout from '../components/Layout';
import {
  Wrench,
  ClipboardList,
  Monitor,
  Thermometer,
  Search,
  Plus,
  User,
  Clock,
  ChevronRight,
  GripVertical,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Settings,
  Lightbulb,
  Wind,
  Camera,
  DoorOpen,
  Flame,
} from 'lucide-react';
import type { WorkOrder, Device, TicketStatus, DeviceType } from '../../shared/types';

const ticketColumns: { key: TicketStatus; title: string; color: string; icon: typeof Loader2 }[] = [
  { key: 'NEW', title: '新建工单', color: 'primary', icon: ClipboardList },
  { key: 'ASSIGNED', title: '已派单', color: 'warning', icon: User },
  { key: 'IN_PROGRESS', title: '处理中', color: 'warning', icon: Loader2 },
  { key: 'COMPLETED', title: '已完成', color: 'success', icon: CheckCircle },
];

const deviceTypeIcons: Record<DeviceType, typeof Monitor> = {
  PROJECTOR: Monitor,
  AIR_CONDITION: Wind,
  COMPUTER: Settings,
  LIGHT: Lightbulb,
  BLACKBOARD: Monitor,
  CCTV: Camera,
  ACCESS_DOOR: DoorOpen,
  FIRE_ALARM: Flame,
};

const deviceTypeLabels: Record<DeviceType, string> = {
  PROJECTOR: '投影仪',
  AIR_CONDITION: '空调',
  COMPUTER: '计算机',
  LIGHT: '照明系统',
  BLACKBOARD: '智能黑板',
  CCTV: '监控摄像头',
  ACCESS_DOOR: '门禁',
  FIRE_ALARM: '消防报警',
};

const mockDevices: Device[] = [
  { id: 'd1', deviceCode: 'DEV-PJ-001', name: 'A101教室投影仪', type: 'PROJECTOR', location: '教学楼A · 101教室', classroomId: 'c1', status: 'NORMAL', lastMaintenanceDate: '2026-05-10', nextMaintenanceDate: '2026-08-10', position3D: { x: 0, y: 0, z: 0, scene: 'teaching' } },
  { id: 'd2', deviceCode: 'DEV-AC-012', name: 'A201教室空调1号', type: 'AIR_CONDITION', location: '教学楼A · 201教室', classroomId: 'c3', status: 'WARNING', lastMaintenanceDate: '2026-04-15', nextMaintenanceDate: '2026-07-15', faultDescription: '制冷效果下降', position3D: { x: 0, y: 0, z: 0, scene: 'teaching' } },
  { id: 'd3', deviceCode: 'DEV-CP-045', name: '图书馆电子阅览区05号机', type: 'COMPUTER', location: '图书馆C区 · 第3排', status: 'FAULT', lastMaintenanceDate: '2026-03-20', nextMaintenanceDate: '2026-06-20', faultTime: '2026-06-16T09:30:00', faultDescription: '无法开机，电源指示灯不亮', position3D: { x: 0, y: 0, z: 0, scene: 'library' } },
  { id: 'd4', deviceCode: 'DEV-LT-089', name: '食堂大厅主照明', type: 'LIGHT', location: '食堂1层 · 中央大厅', status: 'NORMAL', lastMaintenanceDate: '2026-05-28', nextMaintenanceDate: '2026-08-28', position3D: { x: 0, y: 0, z: 0, scene: 'canteen' } },
  { id: 'd5', deviceCode: 'DEV-CT-003', name: '校门口高清摄像头', type: 'CCTV', location: '学校正门 · 门卫室上方', status: 'NORMAL', lastMaintenanceDate: '2026-05-01', nextMaintenanceDate: '2026-11-01', position3D: { x: 0, y: 0, z: 0, scene: 'teaching' } },
  { id: 'd6', deviceCode: 'DEV-BB-028', name: 'B302智能黑板', type: 'BLACKBOARD', location: '教学楼B · 302教室', classroomId: 'c5', status: 'MAINTENANCE', lastMaintenanceDate: '2026-06-17', nextMaintenanceDate: '2026-09-17', position3D: { x: 0, y: 0, z: 0, scene: 'teaching' } },
  { id: 'd7', deviceCode: 'DEV-FA-007', name: '宿舍楼消防报警主机', type: 'FIRE_ALARM', location: '2号宿舍楼 · 1层值班室', status: 'NORMAL', lastMaintenanceDate: '2026-06-01', nextMaintenanceDate: '2026-12-01', position3D: { x: 0, y: 0, z: 0, scene: 'dormitory' } },
];

const mockWorkOrders: WorkOrder[] = [
  { id: 'wo1', ticketNo: 'WO-20260617-001', deviceId: 'd3', deviceName: '图书馆05号计算机', deviceType: 'COMPUTER', location: '图书馆C区', reporterId: 'r1', reporterName: '图书管理员-孙姐', reporterPhone: '138****1111', faultTitle: '无法开机', faultDescription: '按电源键无任何反应，电源指示灯不亮，已检查电源线连接正常', priority: 'HIGH', status: 'NEW', createdAt: '2026-06-17T08:45:00' },
  { id: 'wo2', ticketNo: 'WO-20260617-002', deviceId: 'd2', deviceName: 'A201教室空调', deviceType: 'AIR_CONDITION', location: '教学楼A201', reporterId: 'r2', reporterName: '李老师', faultTitle: '制冷效果差', faultDescription: '设定16度但室内温度仍在28度以上，已使用一周', priority: 'MEDIUM', status: 'NEW', createdAt: '2026-06-17T09:20:00' },
  { id: 'wo3', ticketNo: 'WO-20260616-008', deviceId: 'd1', deviceName: 'A101投影仪', deviceType: 'PROJECTOR', location: '教学楼A101', reporterId: 'r3', reporterName: '王老师', reporterPhone: '139****2222', faultTitle: '画面模糊偏色', faultDescription: '投影画面发黄，对焦困难，影响PPT展示', priority: 'MEDIUM', status: 'ASSIGNED', assigneeId: 'e1', assigneeName: '张工（维修组）', createdAt: '2026-06-16T15:30:00', assignedAt: '2026-06-16T16:00:00' },
  { id: 'wo4', ticketNo: 'WO-20260616-005', deviceId: 'd6', deviceName: 'B302智能黑板', deviceType: 'BLACKBOARD', location: '教学楼B302', reporterId: 'r4', reporterName: '赵老师', faultTitle: '触控失灵', faultDescription: '屏幕右侧约1/4区域触控无响应，已尝试重启无效', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: 'e2', assigneeName: '李工（电子组）', createdAt: '2026-06-16T10:00:00', assignedAt: '2026-06-16T10:30:00', startedAt: '2026-06-16T14:00:00', repairNote: '已拆检，确认为触控模组故障，正在等待备件' },
  { id: 'wo5', ticketNo: 'WO-20260615-012', deviceId: 'd5', deviceName: '校门口摄像头', deviceType: 'CCTV', location: '学校正门', reporterId: 'r5', reporterName: '保安队长', faultTitle: '夜视模糊', faultDescription: '夜间红外模式下画面噪点严重，无法清晰识别车牌', priority: 'LOW', status: 'COMPLETED', assigneeId: 'e1', assigneeName: '张工（维修组）', createdAt: '2026-06-15T22:00:00', assignedAt: '2026-06-16T08:00:00', startedAt: '2026-06-16T09:00:00', completedAt: '2026-06-16T11:30:00', repairNote: '清洁镜头并调整红外灯角度，问题解决', repairCost: 0, rating: 5 },
];

const priorityConfig = {
  LOW: { label: '低', className: 'badge-primary' },
  MEDIUM: { label: '中', className: 'badge-warning' },
  HIGH: { label: '高', className: 'badge-danger' },
  CRITICAL: { label: '紧急', className: 'badge-danger' },
};

const statusColors = {
  NORMAL: { label: '正常', className: 'badge-success', dot: 'bg-success' },
  WARNING: { label: '告警', className: 'badge-warning', dot: 'bg-warning' },
  FAULT: { label: '故障', className: 'badge-danger', dot: 'bg-danger' },
  MAINTENANCE: { label: '维护中', className: 'badge-primary', dot: 'bg-primary-300' },
};

export default function DevicePage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'list'>('kanban');
  const [tickets, setTickets] = useState<WorkOrder[]>(mockWorkOrders);
  const [draggedTicket, setDraggedTicket] = useState<WorkOrder | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<Device['status'] | 'all'>('all');

  const filteredDevices = mockDevices.filter(d => {
    if (deviceStatusFilter !== 'all' && d.status !== deviceStatusFilter) return false;
    if (deviceSearch && !d.name.toLowerCase().includes(deviceSearch.toLowerCase()) && !d.deviceCode.toLowerCase().includes(deviceSearch.toLowerCase())) return false;
    return true;
  });

  const handleDragStart = (ticket: WorkOrder) => setDraggedTicket(ticket);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetStatus: TicketStatus) => {
    if (!draggedTicket) return;
    setTickets(prev => prev.map(t => t.id === draggedTicket.id ? { ...t, status: targetStatus } : t));
    setDraggedTicket(null);
  };

  const getTicketsByStatus = (status: TicketStatus) => tickets.filter(t => t.status === status);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Wrench className="w-7 h-7 text-warning" />
              设备与工单管理
            </h2>
            <p className="text-gray-500 mt-1">设备全生命周期管理 · 智能工单派单系统</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'kanban'
                  ? 'bg-gradient-to-r from-warning to-amber-600 text-white font-medium shadow-lg shadow-warning/20'
                  : 'bg-bg-card border border-bg-border text-gray-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              工单看板
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-warning to-amber-600 text-white font-medium shadow-lg shadow-warning/20'
                  : 'bg-bg-card border border-bg-border text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              设备列表
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white font-medium">
              <Plus className="w-4 h-4" />
              新建工单
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '设备总数', value: mockDevices.length, color: 'primary', icon: Monitor },
            { label: '正常运行', value: mockDevices.filter(d => d.status === 'NORMAL').length, color: 'success', icon: CheckCircle },
            { label: '故障告警', value: mockDevices.filter(d => d.status === 'FAULT' || d.status === 'WARNING').length, color: 'danger', icon: AlertTriangle },
            { label: '待处理工单', value: tickets.filter(t => t.status !== 'COMPLETED').length, color: 'warning', icon: Wrench },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl bg-gradient-to-br from-${stat.color}/15 to-transparent border border-${stat.color}/30 backdrop-blur`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                <span className={`text-2xl font-bold font-orbitron text-${stat.color}`}>{stat.value}</span>
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {activeTab === 'kanban' ? (
          <>
            <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
              <div className="p-5 border-b border-bg-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <GripVertical className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div>3D 设备管理场景</div>
                    <div className="text-xs text-gray-500 font-normal">可视化查看设备位置 · 状态实时同步</div>
                  </div>
                </h3>
              </div>
              <div className="relative h-[180px] bg-gradient-to-br from-warning/10 via-bg-light to-primary/10 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(rgba(252, 163, 17, 0.08) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(252, 163, 17, 0.08) 1px, transparent 1px)`,
                  backgroundSize: '50px 50px',
                }}></div>
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning/25 to-primary/15 flex items-center justify-center border border-warning/40 animate-float">
                    <Wrench className="w-8 h-8 text-warning" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">3D 场景占位</h4>
                    <p className="text-gray-500 text-sm">此处将展示校园内设备的3D分布及实时状态</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {ticketColumns.map((col) => {
                const columnTickets = getTicketsByStatus(col.key);
                return (
                  <div
                    key={col.key}
                    className={`rounded-2xl bg-bg-card border border-${col.color}/20 overflow-hidden`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(col.key)}
                  >
                    <div className={`p-4 bg-${col.color}/10 border-b border-${col.color}/20`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <col.icon className={`w-4 h-4 text-${col.color}`} />
                          <span className={`font-semibold text-${col.color}`}>{col.title}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${col.color}/20 text-${col.color}`}>
                          {columnTickets.length}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-3 min-h-[400px] max-h-[550px] overflow-y-auto">
                      {columnTickets.map((ticket) => {
                        const Icon = deviceTypeIcons[ticket.deviceType];
                        return (
                          <div
                            key={ticket.id}
                            draggable
                            onDragStart={() => handleDragStart(ticket)}
                            className="p-4 rounded-xl bg-bg-light/80 border border-bg-border cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all card-hover group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg bg-${col.color}/15 flex items-center justify-center`}>
                                  <Icon className={`w-4 h-4 text-${col.color}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{ticket.faultTitle}</div>
                                  <div className="text-[10px] text-gray-500 font-mono">{ticket.ticketNo}</div>
                                </div>
                              </div>
                              <span className={`badge ${priorityConfig[ticket.priority].className} flex-shrink-0`}>
                                {priorityConfig[ticket.priority].label}
                              </span>
                            </div>

                            <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                              {ticket.faultDescription}
                            </div>

                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <Monitor className="w-3 h-3" /> {ticket.deviceName}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <Thermometer className="w-3 h-3" /> {ticket.location}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <User className="w-3 h-3" /> 报修人: {ticket.reporterName}
                                </span>
                              </div>
                            </div>

                            {ticket.assigneeName && (
                              <div className="pt-2 border-t border-bg-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                                    <User className="w-3 h-3 text-success" />
                                  </div>
                                  <span className="text-gray-400">{ticket.assigneeName}</span>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-primary-300 flex items-center gap-0.5 hover:underline">
                                  详情 <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-[10px] text-gray-600 mt-2">
                              <Clock className="w-3 h-3" />
                              {new Date(ticket.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}

                      {columnTickets.length === 0 && (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-600">
                          <div className="w-12 h-12 rounded-xl bg-bg-lighter flex items-center justify-center mb-2">
                            <CheckCircle className="w-6 h-6 opacity-40" />
                          </div>
                          <div className="text-xs">暂无工单</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
            <div className="p-5 border-b border-bg-border flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    placeholder="搜索设备名称/编号..."
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-warning/50 input-glow w-60"
                  />
                </div>
                <select
                  value={deviceStatusFilter}
                  onChange={(e) => setDeviceStatusFilter(e.target.value as Device['status'] | 'all')}
                  className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-warning/50 input-glow cursor-pointer"
                >
                  <option value="all" className="bg-bg-card">全部状态</option>
                  <option value="NORMAL" className="bg-bg-card">正常</option>
                  <option value="WARNING" className="bg-bg-card">告警</option>
                  <option value="FAULT" className="bg-bg-card">故障</option>
                  <option value="MAINTENANCE" className="bg-bg-card">维护中</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                共 <span className="text-white font-semibold">{filteredDevices.length}</span> 台设备
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-lighter/50">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left py-3 px-4 font-medium">设备信息</th>
                    <th className="text-left py-3 px-4 font-medium">类型</th>
                    <th className="text-left py-3 px-4 font-medium">位置</th>
                    <th className="text-left py-3 px-4 font-medium">状态</th>
                    <th className="text-left py-3 px-4 font-medium">上次维护</th>
                    <th className="text-left py-3 px-4 font-medium">下次维护</th>
                    <th className="text-left py-3 px-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {filteredDevices.map((device) => {
                    const Icon = deviceTypeIcons[device.type];
                    const now = new Date();
                    const nextMaint = new Date(device.nextMaintenanceDate);
                    const daysUntil = Math.ceil((nextMaint.getTime() - now.getTime()) / 86400000);
                    return (
                      <tr key={device.id} className="table-row">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-${device.status === 'NORMAL' ? 'success' : device.status === 'WARNING' ? 'warning' : 'danger'}/15 flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 text-${device.status === 'NORMAL' ? 'success' : device.status === 'WARNING' ? 'warning' : 'danger'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{device.name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">{device.deviceCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-bg-lighter text-gray-400">
                            {deviceTypeLabels[device.type]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">{device.location}</td>
                        <td className="py-3 px-4">
                          <span className={`badge ${statusColors[device.status].className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusColors[device.status].dot} ${device.status === 'FAULT' ? 'animate-pulse' : ''}`}></span>
                            {statusColors[device.status].label}
                          </span>
                          {device.faultDescription && (
                            <div className="text-[11px] text-danger mt-1">{device.faultDescription}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">{device.lastMaintenanceDate}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{device.nextMaintenanceDate}</div>
                          <div className={`text-[11px] ${
                            daysUntil <= 7 ? 'text-danger' : daysUntil <= 30 ? 'text-warning' : 'text-gray-500'
                          }`}>
                            {daysUntil > 0 ? `还有 ${daysUntil} 天` : `已逾期 ${-daysUntil} 天`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-lg bg-primary/10 text-primary-300 hover:bg-primary/20 transition-colors">
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg bg-bg-lighter text-gray-400 hover:text-white transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
