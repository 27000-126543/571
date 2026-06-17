import { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';
import type { PurchaseOrder, Visitor, WorkOrder, ApprovalStatus, ApiResponse } from '../../shared/types';

type TabType = 'purchase' | 'visitor' | 'workorder';

interface ApprovalTodoItem {
  id: string;
  orderType: 'PURCHASE' | 'VISITOR' | 'WORKORDER';
  orderNo?: string;
  title: string;
  status: ApprovalStatus;
  currentLevel: 1 | 2 | 3;
  createdBy?: string;
  createdAt: string;
  amount?: number;
  target?: string;
}

const tabs: { key: TabType; label: string; icon: typeof ShoppingCart }[] = [
  { key: 'purchase', label: '采购审批', icon: ShoppingCart },
  { key: 'visitor', label: '访客审批', icon: UserCheck },
  { key: 'workorder', label: '工单审批', icon: Wrench },
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

const priorityConfig = {
  LOW: { label: '低', className: 'badge-primary' },
  MEDIUM: { label: '中', className: 'badge-warning' },
  HIGH: { label: '高', className: 'badge-danger' },
  CRITICAL: { label: '紧急', className: 'badge-danger' },
};

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('purchase');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [todoItems, setTodoItems] = useState<ApprovalTodoItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { user } = useAuthStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resTodo = await apiClient.get<ApiResponse<{ items: ApprovalTodoItem[]; total: number }>>('/approvals/todo');
      if (resTodo.data.code === 0 && resTodo.data.data) {
        setTodoItems(resTodo.data.data.items);
      }

      const resP = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/canteen/purchase-orders');
      if (resP.data.code === 0 && resP.data.data) {
        setPurchases(resP.data.data);
      }

      const resV = await apiClient.get<ApiResponse<Visitor[]>>('/visitors');
      if (resV.data.code === 0 && resV.data.data) {
        setVisitors(resV.data.data);
      }

      const resW = await apiClient.get<ApiResponse<WorkOrder[]>>('/devices/work-orders');
      if (resW.data.code === 0 && resW.data.data) {
        setWorkOrders(resW.data.data);
      }
    } catch (e) {
      console.error('获取审批数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const userLevel = user?.role === 'logistics_director' ? 1
    : user?.role === 'moral_director' ? 2
    : user?.role === 'principal' ? 3
    : user?.role === 'head_teacher' ? 'HEAD_TEACHER'
    : null;

  const canApprove = (item: { status: ApprovalStatus; currentLevel: number; headTeacherId?: string }): boolean => {
    if (!item.status.startsWith('PENDING')) return false;
    if (userLevel === 'HEAD_TEACHER' && item.currentLevel === 1 && item.headTeacherId === user?.id) {
      return true;
    }
    if (typeof userLevel === 'number') {
      return userLevel === item.currentLevel;
    }
    return false;
  };

  const handleApprove = async (id: string, orderType: 'PURCHASE' | 'VISITOR' | 'WORKORDER') => {
    setActioningId(id);
    try {
      const res = await apiClient.post<ApiResponse<PurchaseOrder | Visitor | WorkOrder>>(
        `/approvals/${id}/approve`,
        { orderType }
      );
      if (res.data.code === 0) {
        fetchData();
      }
    } catch (e: any) {
      console.error('审批失败:', e);
      alert(e?.response?.data?.message || '审批失败');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string, orderType: 'PURCHASE' | 'VISITOR' | 'WORKORDER') => {
    const comment = prompt('请输入驳回原因：');
    if (comment === null) return;
    setActioningId(id);
    try {
      const res = await apiClient.post<ApiResponse<PurchaseOrder | Visitor | WorkOrder>>(
        `/approvals/${id}/reject`,
        { orderType, comment }
      );
      if (res.data.code === 0) {
        fetchData();
      }
    } catch (e: any) {
      console.error('驳回失败:', e);
      alert(e?.response?.data?.message || '驳回失败');
    } finally {
      setActioningId(null);
    }
  };

  const pendingPurchases = [
    ...purchases.filter(p => p.status.startsWith('PENDING')),
    ...purchases.filter(p => !p.status.startsWith('PENDING')),
  ];
  const pendingVisitors = [
    ...visitors.filter(v => v.status.startsWith('PENDING')),
    ...visitors.filter(v => !v.status.startsWith('PENDING')),
  ];
  const pendingWorkOrders = [
    ...workOrders.filter(w => w.status === 'NEW' || w.status.startsWith('PENDING')),
    ...workOrders.filter(w => w.status !== 'NEW' && !w.status.startsWith('PENDING')),
  ];

  const pendingStats = {
    purchase: purchases.filter(p => p.status.startsWith('PENDING')).length,
    visitor: visitors.filter(v => v.status.startsWith('PENDING')).length,
    workorder: todoItems.filter(w => w.orderType === 'WORKORDER').length,
  };

  const renderPurchaseCard = (po: PurchaseOrder) => {
    const canAct = canApprove({ status: po.status, currentLevel: po.currentLevel });
    const isActioning = actioningId === po.id;

    return (
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
                    <Clock className="w-3.5 h-3.5" /> {dayjs(po.createdAt).format('YYYY-MM-DD HH:mm')}
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
                      <span className="text-xs text-gray-500">{dayjs(ap.approvedAt).format('YYYY-MM-DD HH:mm')}</span>
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
            {canAct ? (
              <>
                <button
                  onClick={() => handleReject(po.id, 'PURCHASE')}
                  disabled={isActioning}
                  className="px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  驳回申请
                </button>
                <button
                  onClick={() => handleApprove(po.id, 'PURCHASE')}
                  disabled={isActioning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-60"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  通过审批
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>当前级别不符，无法操作</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderVisitorCard = (v: Visitor) => {
    const todoItem = todoItems.find(t => t.orderType === 'VISITOR' && t.id === v.id);
    const currentLevel = todoItem?.currentLevel || 1;
    const canAct = canApprove({ status: v.status, currentLevel, headTeacherId: v.headTeacherId });
    const isActioning = actioningId === v.id;

    return (
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
                  <div>📅 {dayjs(v.visitDate).format('YYYY-MM-DD')} {v.startTime} - {v.endTime}</div>
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
              申请于 {dayjs(v.createdAt).format('YYYY-MM-DD HH:mm')}
            </div>
          </div>
        </div>

        {v.status.startsWith('PENDING') && (
          <div className="border-t border-bg-border p-4 flex items-center justify-end gap-3 bg-gradient-to-r from-transparent via-bg-light/30 to-transparent">
            {canAct ? (
              <>
                <button
                  onClick={() => handleReject(v.id, 'VISITOR')}
                  disabled={isActioning}
                  className="px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  拒绝
                </button>
                <button
                  onClick={() => handleApprove(v.id, 'VISITOR')}
                  disabled={isActioning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  批准
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>当前级别不符，无法操作</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderWorkOrderCard = (wo: WorkOrder & { approvalRequired?: boolean; approvalStatus?: ApprovalStatus }) => {
    const todoItem = todoItems.find(t => t.orderType === 'WORKORDER' && t.id === wo.id);
    const currentLevel = todoItem?.currentLevel || 1;
    const displayStatus = (wo.status === 'NEW' || wo.status.startsWith('PENDING'))
      ? `PENDING_L${currentLevel}` as ApprovalStatus
      : wo.status as ApprovalStatus;
    const canAct = canApprove({ status: displayStatus, currentLevel });
    const isActioning = actioningId === wo.id;

    return (
      <div key={wo.id} className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden card-hover">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/25 to-danger/15 flex items-center justify-center border border-warning/30 flex-shrink-0">
                <Wrench className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <h3 className="font-bold text-lg truncate">{wo.faultTitle}</h3>
                  <span className={`badge ${priorityConfig[wo.priority].className}`}>
                    优先级: {priorityConfig[wo.priority].label}
                  </span>
                  <span className={`badge ${statusConfig[displayStatus] ? statusConfig[displayStatus].className : 'badge-primary'}`}>
                    {statusConfig[displayStatus] ? statusConfig[displayStatus].label : wo.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <div>🔧 {wo.deviceName} · 📍 {wo.location}</div>
                  <div>📋 工单编号: {wo.ticketNo} · 申请人: {wo.reporterName}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-gray-500 mb-1">预估维修费用</div>
              <div className="font-orbitron text-2xl font-bold text-warning">
                ¥{wo.repairCost?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-light/50 border border-bg-border mb-4">
            <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> 维修详情
            </div>
            <p className="text-sm text-gray-300">{wo.faultDescription}</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              创建于 {dayjs(wo.createdAt).format('YYYY-MM-DD HH:mm')}
              {wo.assigneeName && <span className="ml-2">· 派单给: {wo.assigneeName}</span>}
            </div>
          </div>
        </div>

        {(wo.status === 'NEW' || wo.status.startsWith('PENDING')) && (
          <div className="border-t border-bg-border p-4 flex items-center justify-end gap-3 bg-gradient-to-r from-transparent via-bg-light/30 to-transparent">
            {canAct ? (
              <>
                <button
                  onClick={() => handleReject(wo.id, 'WORKORDER')}
                  disabled={isActioning}
                  className="px-5 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  驳回（退回重审）
                </button>
                <button
                  onClick={() => handleApprove(wo.id, 'WORKORDER')}
                  disabled={isActioning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white hover:shadow-lg hover:shadow-success/30 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  批准费用
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>当前级别不符，无法操作</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              刷新
            </button>
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
                <tab.icon className="w-5 h-5" />
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
              className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-primary/50 input-glow cursor-pointer"
            >
              <option value="all" className="bg-bg-card">全部状态</option>
              <option value="PENDING_L1" className="bg-bg-card">L1待批</option>
              <option value="PENDING_L2" className="bg-bg-card">L2待批</option>
              <option value="PENDING_L3" className="bg-bg-card">L3待批</option>
              <option value="APPROVED" className="bg-bg-card">已批准</option>
              <option value="REJECTED" className="bg-bg-card">已拒绝</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">加载审批数据中...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'purchase' && pendingPurchases
              .filter(p => statusFilter === 'all' || p.status === statusFilter)
              .filter(p => !searchText || p.title.includes(searchText) || (p.createdBy || '').includes(searchText))
              .map(po => renderPurchaseCard(po))}

            {activeTab === 'visitor' && pendingVisitors
              .filter(v => statusFilter === 'all' || v.status === statusFilter)
              .filter(v => !searchText || v.visitorName.includes(searchText) || v.targetName.includes(searchText))
              .map(v => renderVisitorCard(v))}

            {activeTab === 'workorder' && pendingWorkOrders
              .filter(w => statusFilter === 'all' || w.status === statusFilter || (statusFilter === 'PENDING_L1' && w.status === 'NEW'))
              .filter(w => !searchText || w.deviceName.includes(searchText) || w.faultTitle.includes(searchText))
              .map(wo => renderWorkOrderCard(wo as any))}
          </div>
        )}
      </div>
    </Layout>
  );
}
