import { useState } from 'react';
import Layout from '../components/Layout';
import {
  ClipboardList,
  ShoppingCart,
  UserCheck,
  Wrench,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileText,
  MessageSquare,
} from 'lucide-react';
import type { PurchaseOrder, Visitor, WorkOrder, ApprovalStatus } from '../../shared/types';

type TabType = 'purchase' | 'visitor' | 'workorder';

const tabs: { key: TabType; label: string; icon: typeof ShoppingCart }[] = [
  { key: 'purchase', label: '采购审批', icon: ShoppingCart },
  { key: 'visitor', label: '访客审批', icon: UserCheck },
  { key: 'workorder', label: '工单审批', icon: Wrench },
];

const mockPurchases: PurchaseOrder[] = [
  {
    id: 'po1', orderNo: 'PO-2026-0617-003', title: '6月下旬教学设备采购',
    items: [
      { itemId: 'i1', itemName: '激光投影仪×2', quantity: 2, unit: '台', estimatedPrice: 8500 },
      { itemId: 'i2', itemName: '无线麦克风×5', quantity: 5, unit: '套', estimatedPrice: 1200 },
    ],
    totalAmount: 23000, status: 'PENDING_L1', currentLevel: 1,
    createdBy: '教务处-王主任', createdAt: '2026-06-17 10:30:00',
    approvals: [{ level: 1, approved: false }, { level: 2, approved: false }, { level: 3, approved: false }],
  },
  {
    id: 'po2', orderNo: 'PO-2026-0617-002', title: '米面油紧急补货',
    items: [
      { itemId: 'i1', itemName: '东北大米', quantity: 500, unit: 'kg', estimatedPrice: 6 },
      { itemId: 'i2', itemName: '一级大豆油', quantity: 200, unit: 'L', estimatedPrice: 12 },
    ],
    totalAmount: 5400, status: 'PENDING_L2', currentLevel: 2,
    createdBy: '食堂管理员', createdAt: '2026-06-17 08:15:00',
    approvals: [
      { level: 1, approved: true, approverName: '后勤李主任', approvedAt: '2026-06-17 08:45:00', comment: '同意，库存紧张请尽快处理' },
      { level: 2, approved: false }, { level: 3, approved: false },
    ],
  },
  {
    id: 'po3', orderNo: 'PO-2026-0616-009', title: '信息化设备年度采购',
    items: [
      { itemId: 'i3', itemName: '学生用电脑', quantity: 60, unit: '台', estimatedPrice: 4500 },
    ],
    totalAmount: 270000, status: 'PENDING_L3', currentLevel: 3,
    createdBy: '信息中心', createdAt: '2026-06-16 14:20:00',
    approvals: [
      { level: 1, approved: true, approverName: '后勤李主任', approvedAt: '2026-06-16 15:00:00' },
      { level: 2, approved: true, approverName: '德育张主任', approvedAt: '2026-06-16 16:30:00' },
      { level: 3, approved: false },
    ],
  },
  {
    id: 'po4', orderNo: 'PO-2026-0615-008', title: '体育器材补充',
    items: [{ itemId: 'i4', itemName: '篮球×20 足球×15', quantity: 35, unit: '个', estimatedPrice: 180 }],
    totalAmount: 6300, status: 'APPROVED', currentLevel: 3,
    createdBy: '体育组', createdAt: '2026-06-15 11:00:00',
    approvals: [
      { level: 1, approved: true, approverName: '后勤主任', approvedAt: '2026-06-15 14:00:00' },
      { level: 2, approved: true, approverName: '德育主任', approvedAt: '2026-06-15 16:00:00' },
      { level: 3, approved: true, approverName: '校长', approvedAt: '2026-06-15 17:30:00', comment: '同意，注意器材质量验收' },
    ],
  },
];

const mockVisitors: Visitor[] = [
  {
    id: 'v1', visitorName: '王国栋', relation: '父亲',
    visitDate: '2026-06-17', startTime: '14:00', endTime: '16:00',
    purpose: '参加家长会，与班主任讨论学生学习情况',
    targetName: '王小明（三年级2班）', targetLocation: '教学楼A · 302教室',
    phone: '139****5678', idCardNo: '110***1234',
    status: 'PENDING_L1', targetType: 'STUDENT', targetId: 's1',
    createdAt: '2026-06-17 08:30:00',
  } as Visitor,
  {
    id: 'v2', visitorName: '张明远', relation: '公务',
    visitDate: '2026-06-18', startTime: '09:00', endTime: '11:00',
    purpose: '教育局安全检查，消防设施验收',
    targetName: '校长办公室 / 后勤处', targetLocation: '行政楼 · 3层',
    phone: '137****2222', idCardNo: '110***9012',
    status: 'PENDING_L2', targetType: 'OFFICE', targetId: 'off1',
    createdAt: '2026-06-16 16:00:00',
  } as Visitor,
  {
    id: 'v3', visitorName: '李秀英', relation: '奶奶',
    visitDate: '2026-06-17', startTime: '11:30', endTime: '12:30',
    purpose: '给孙子送午餐及换季衣物',
    targetName: '李小华（一年级1班）', targetLocation: '1号宿舍楼 · 305室',
    phone: '138****8888', idCardNo: '110***5678',
    status: 'APPROVED', targetType: 'STUDENT', targetId: 's2',
    headTeacherId: 't2', qrCodeToken: 'QR202606170001V2',
    checkInTime: '2026-06-17 11:25:00', createdAt: '2026-06-16 20:00:00',
  } as Visitor,
];

const mockWorkOrderApprovals: (WorkOrder & { approvalRequired: boolean; approvalStatus: ApprovalStatus })[] = [
  {
    id: 'wa1', ticketNo: 'WO-20260617-005', deviceName: '行政楼电梯主板更换',
    deviceType: 'ACCESS_DOOR', location: '行政楼 · 1号电梯',
    reporterName: '后勤-赵主管', reporterId: 'r1', reporterPhone: '139****5555',
    faultTitle: '电梯主板损坏需更换',
    faultDescription: '电梯主板损坏，需要更换原厂配件，预算金额约15000元',
    priority: 'CRITICAL', status: 'ASSIGNED', assigneeId: 'e1', assigneeName: '外部维修单位',
    createdAt: '2026-06-17 09:00:00', assignedAt: '2026-06-17 09:30:00',
    repairCost: 15000,
    approvalRequired: true, approvalStatus: 'PENDING_L1',
  } as any,
  {
    id: 'wa2', ticketNo: 'WO-20260616-011', deviceName: '体育馆中央空调系统',
    deviceType: 'AIR_CONDITION', location: '体育馆 · 主机房',
    reporterName: '体育馆管理员', reporterId: 'r2',
    faultTitle: '中央空调年度深度保养',
    faultDescription: '年度例行深度保养，含冷媒检测、滤网更换、管路清洗等',
    priority: 'LOW', status: 'NEW',
    createdAt: '2026-06-16 14:00:00',
    repairCost: 8500,
    approvalRequired: true, approvalStatus: 'PENDING_L2',
  } as any,
];

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'badge-primary' },
  PENDING_L1: { label: 'L1待批', className: 'badge-danger' },
  PENDING_L2: { label: 'L2待批', className: 'badge-warning' },
  PENDING_L3: { label: 'L3待批', className: 'badge-warning' },
  APPROVED: { label: '已批准', className: 'badge-success' },
  REJECTED: { label: '已拒绝', className: 'badge-danger' },
  EXECUTED: { label: '已执行', className: 'badge-success' },
  CANCELLED: { label: '已取消', className: 'badge-primary' },
};

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('purchase');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pendingStats = {
    purchase: mockPurchases.filter(p => p.status.startsWith('PENDING')).length,
    visitor: mockVisitors.filter(v => v.status.startsWith('PENDING')).length,
    workorder: mockWorkOrderApprovals.filter(w => w.approvalStatus.startsWith('PENDING')).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <ClipboardList className="w-7 h-7 text-primary-300" />
              统一审批中心
            </h2>
            <p className="text-gray-500 mt-1">采购单 · 访客申请 · 费用工单 · 一站式审批</p>
          </div>
        </div>

        <div className="flex p-1.5 rounded-2xl bg-bg-card border border-bg-border overflow-x-auto">
          {tabs.map((tab) => {
            const pending = pendingStats[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-medium transition-all whitespace-nowrap min-w-[180px] ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-700 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? '' : ''}`} />
                <span>{tab.label}</span>
                {pending > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-danger text-white'
                  }`}>
                    {pending}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-bg-card border border-bg-border p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索审批标题/申请人..."
                className="pl-10 pr-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 input-glow w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
              className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-primary/50 input-glow cursor-pointer flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <option value="all" className="bg-bg-card">全部状态</option>
              <option value="PENDING_L1" className="bg-bg-card">L1待批</option>
              <option value="PENDING_L2" className="bg-bg-card">L2待批</option>
              <option value="PENDING_L3" className="bg-bg-card">L3待批</option>
              <option value="APPROVED" className="bg-bg-card">已批准</option>
              <option value="REJECTED" className="bg-bg-card">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {activeTab === 'purchase' && mockPurchases
            .filter(p => statusFilter === 'all' || p.status === statusFilter)
            .filter(p => !searchText || p.title.includes(searchText) || p.createdBy.includes(searchText))
            .map((po) => (
            <div key={po.id} className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden card-hover">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-warning/15 flex items-center justify-center border border-primary/30 flex-shrink-0">
                      <ShoppingCart className="w-6 h-6 text-primary-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-lg truncate">{po.title}</h3>
                        <span className={`badge ${statusConfig[po.status].className}`}>
                          {statusConfig[po.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-xs">{po.orderNo}</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {po.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {po.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500 mb-1">申请金额</div>
                    <div className="font-orbitron text-2xl font-bold text-warning">
                      ¥{po.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {po.items.map((it, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-bg-lighter text-gray-400 border border-bg-border">
                      {it.itemName} × {it.quantity}{it.unit}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-bg-border">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map(lv => {
                      const approval = po.approvals.find(a => a.level === lv);
                      const isCurrent = po.currentLevel === lv && po.status.startsWith('PENDING');
                      const isDone = approval?.approved;
                      return (
                        <div key={lv} className="flex items-center">
                          <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? 'bg-success/20 text-success border-2 border-success/40'
                              : isCurrent
                              ? 'bg-warning/20 text-warning border-2 border-warning/40 animate-pulse'
                              : 'bg-bg-lighter text-gray-500 border-2 border-bg-border'
                          }`}>
                            {isDone ? <CheckCircle className="w-4 h-4" /> : `L${lv}`}
                          </div>
                          {lv < 3 && (
                            <div className={`w-10 h-0.5 ${
                              isDone && po.approvals.find(a => a.level === lv + 1)?.approved ? 'bg-success/30' : 'bg-bg-border'
                            }`}></div>
                          )}
                        </div>
                      );
                    })}
                    <span className="ml-4 text-xs text-gray-500">
                      当前: L{po.currentLevel} 审批
                    </span>
                  </div>

                  <button
                    onClick={() => toggleExpand(po.id)}
                    className="text-sm text-primary-300 hover:text-primary-200 flex items-center gap-1 transition-colors"
                  >
                    {expandedItems.has(po.id) ? '收起详情' : '查看审批流'}
                    {expandedItems.has(po.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expandedItems.has(po.id) && (
                <div className="border-t border-bg-border bg-bg-light/30 p-5">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary-300" />
                    审批流程记录
                  </h4>
                  <div className="space-y-3">
                    {po.approvals.map((ap) => (
                      <div key={ap.level} className={`p-4 rounded-xl border ${
                        ap.approved
                          ? 'bg-success/5 border-success/20'
                          : ap.approved === false && po.status !== 'REJECTED'
                          ? 'bg-bg-lighter border-bg-border opacity-50'
                          : 'bg-warning/5 border-warning/20'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`badge ${ap.approved ? 'badge-success' : 'badge-warning'}`}>
                              L{ap.level} 审批
                            </span>
                            <span className="font-medium text-sm">
                              {ap.approverName || (ap.approved === false ? '等待审批' : '待审批人处理')}
                            </span>
                          </div>
                          {ap.approvedAt && (
                            <span className="text-xs text-gray-500">{ap.approvedAt}</span>
                          )}
                        </div>
                        {ap.comment && (
                          <div className="flex items-start gap-2 text-sm text-gray-400 pl-1">
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{ap.comment}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {po.status.startsWith('PENDING') && (
                <div className="border-t border-bg-border p-4 flex items-center justify-end gap-3 bg-gradient-to-r from-transparent via-bg-light/30 to-transparent">
                  <button className="px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-2 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    驳回申请
                  </button>
                  <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    通过审批
                  </button>
                </div>
              )}
            </div>
          ))}

          {activeTab === 'visitor' && mockVisitors
            .filter(v => statusFilter === 'all' || v.status === statusFilter)
            .filter(v => !searchText || v.visitorName.includes(searchText) || v.targetName.includes(searchText))
            .map((v) => (
            <div key={v.id} className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden card-hover">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/25 to-primary/15 flex items-center justify-center border border-success/30 flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-lg">{v.visitorName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-bg-lighter text-gray-400">{v.relation}</span>
                        <span className={`badge ${statusConfig[v.status].className}`}>
                          {statusConfig[v.status].label}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <div>📞 {v.phone} · 🆔 {v.idCardNo}</div>
                        <div>🎯 被访人: {v.targetName} <span className="text-gray-600">({v.targetLocation})</span></div>
                        <div>📅 {v.visitDate} {v.startTime} - {v.endTime}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-bg-light/50 border border-bg-border mb-4">
                  <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> 来访事由
                  </div>
                  <p className="text-sm text-gray-300">{v.purpose}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    申请于 {v.createdAt}
                  </div>
                </div>
              </div>

              {v.status.startsWith('PENDING') && (
                <div className="border-t border-bg-border p-4 flex items-center justify-end gap-3 bg-gradient-to-r from-transparent via-bg-light/30 to-transparent">
                  <button className="px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-2 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    拒绝
                  </button>
                  <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    批准
                  </button>
                </div>
              )}
            </div>
          ))}

          {activeTab === 'workorder' && mockWorkOrderApprovals
            .filter(w => statusFilter === 'all' || w.approvalStatus === statusFilter)
            .filter(w => !searchText || w.deviceName.includes(searchText) || w.faultTitle.includes(searchText))
            .map((w) => (
            <div key={w.id} className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden card-hover">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/25 to-danger/15 flex items-center justify-center border border-warning/30 flex-shrink-0">
                      <Wrench className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-lg truncate">{w.faultTitle}</h3>
                        <span className={`badge ${priorityConfig[w.priority].className}`}>
                          优先级: {priorityConfig[w.priority].label}
                        </span>
                        <span className={`badge ${statusConfig[w.approvalStatus].className}`}>
                          {statusConfig[w.approvalStatus].label}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <div>🔧 {w.deviceName} · 📍 {w.location}</div>
                        <div>📋 工单编号: {w.ticketNo} · 申请人: {w.reporterName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500 mb-1">预估维修费用</div>
                    <div className="font-orbitron text-2xl font-bold text-warning">
                      ¥{w.repairCost?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-bg-light/50 border border-bg-border mb-4">
                  <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> 维修详情
                  </div>
                  <p className="text-sm text-gray-300">{w.faultDescription}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    创建于 {w.createdAt}
                    {w.assigneeName && <span className="ml-2">· 派单给: {w.assigneeName}</span>}
                  </div>
                </div>
              </div>

              {w.approvalStatus.startsWith('PENDING') && (
                <div className="border-t border-bg-border p-4 flex items-center justify-end gap-3 bg-gradient-to-r from-transparent via-bg-light/30 to-transparent">
                  <button className="px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-2 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    驳回（退回重审）
                  </button>
                  <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    批准费用
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

const priorityConfig = {
  LOW: { label: '低', className: 'badge-primary' },
  MEDIUM: { label: '中', className: 'badge-warning' },
  HIGH: { label: '高', className: 'badge-danger' },
  CRITICAL: { label: '紧急', className: 'badge-danger' },
};
