import { useState } from 'react';
import Layout from '../components/Layout';
import {
  UserCheck,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  User,
  QrCode,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Plus,
  IdCard,
  Eye,
  Building2,
} from 'lucide-react';
import type { Visitor, VisitorRelation, ApprovalStatus } from '../../shared/types';

const mockVisitors: Visitor[] = [
  {
    id: 'v1',
    visitorName: '王国栋',
    idCardNo: '110***********1234',
    phone: '139****5678',
    relation: '父亲',
    visitDate: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    purpose: '参加家长会，与班主任讨论学生学习情况',
    targetType: 'STUDENT',
    targetId: 's1',
    targetName: '王小明（三年级2班）',
    targetLocation: '教学楼A · 302教室',
    headTeacherId: 't1',
    status: 'PENDING_L1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'v2',
    visitorName: '李秀英',
    idCardNo: '110***********5678',
    phone: '138****8888',
    relation: '奶奶',
    visitDate: new Date().toISOString().split('T')[0],
    startTime: '11:30',
    endTime: '12:30',
    purpose: '给孙子送午餐及换季衣物',
    targetType: 'STUDENT',
    targetId: 's2',
    targetName: '李小华（一年级1班）',
    targetLocation: '1号宿舍楼 · 305室',
    headTeacherId: 't2',
    status: 'APPROVED',
    qrCodeToken: 'QR202606170001V2',
    checkInTime: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'v3',
    visitorName: '张明远',
    idCardNo: '110***********9012',
    phone: '137****2222',
    relation: '公务',
    visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    purpose: '教育局安全检查，消防设施验收',
    targetType: 'OFFICE',
    targetId: 'off1',
    targetName: '校长办公室 / 后勤处',
    targetLocation: '行政楼 · 3层',
    status: 'PENDING_L2',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'v4',
    visitorName: '刘芳',
    idCardNo: '110***********3456',
    phone: '136****7777',
    relation: '母亲',
    visitDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    startTime: '15:00',
    endTime: '17:00',
    purpose: '探望生病学生，办理临时请假',
    targetType: 'TEACHER',
    targetId: 't3',
    targetName: '班主任：赵老师',
    targetLocation: '教师办公室 · 2楼',
    headTeacherId: 't3',
    status: 'EXECUTED',
    qrCodeToken: 'QR202606160008V4',
    checkInTime: new Date(Date.now() - 90000000).toISOString(),
    checkOutTime: new Date(Date.now() - 82800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'v5',
    visitorName: '陈志强',
    idCardNo: '110***********7890',
    phone: '135****9999',
    relation: '外公',
    visitDate: new Date().toISOString().split('T')[0],
    startTime: '16:30',
    endTime: '17:30',
    purpose: '接学生放学，提前进入等候',
    targetType: 'STUDENT',
    targetId: 's5',
    targetName: '陈小强（五年级3班）',
    targetLocation: '学校正门 · 等候区',
    headTeacherId: 't5',
    status: 'REJECTED',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

const relations: VisitorRelation[] = ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', '其他亲属', '公务'];

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'badge-primary' },
  PENDING_L1: { label: '待审批 L1', className: 'badge-danger' },
  PENDING_L2: { label: '待审批 L2', className: 'badge-warning' },
  PENDING_L3: { label: '待审批 L3', className: 'badge-warning' },
  APPROVED: { label: '已批准', className: 'badge-success' },
  REJECTED: { label: '已拒绝', className: 'badge-danger' },
  EXECUTED: { label: '已完成', className: 'badge-success' },
  CANCELLED: { label: '已取消', className: 'badge-primary' },
};

export default function VisitorPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [showQR, setShowQR] = useState<Visitor | null>(null);
  const [form, setForm] = useState({
    visitorName: '',
    idCardNo: '',
    phone: '',
    relation: '父亲' as VisitorRelation,
    visitDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    purpose: '',
    targetType: 'STUDENT' as Visitor['targetType'],
    targetName: '',
  });

  const filteredVisitors = mockVisitors.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return v.visitorName.toLowerCase().includes(s) || v.targetName.toLowerCase().includes(s);
    }
    return true;
  });

  const pendingCount = mockVisitors.filter(v => v.status.startsWith('PENDING')).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForm({
      visitorName: '',
      idCardNo: '',
      phone: '',
      relation: '父亲',
      visitDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      purpose: '',
      targetType: 'STUDENT',
      targetName: '',
    });
    setActiveTab('list');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-success" />
              访客智能管理
            </h2>
            <p className="text-gray-500 mt-1">访客预约 · 身份核验 · 通行二维码 · 审批流程</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'form'
                  ? 'bg-gradient-to-r from-success to-teal-600 text-white font-medium shadow-lg shadow-success/20'
                  : 'bg-bg-card border border-bg-border text-gray-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              新建预约
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-success to-teal-600 text-white font-medium shadow-lg shadow-success/20'
                  : 'bg-bg-card border border-bg-border text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              审批列表
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-danger text-white text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl bg-bg-card border border-bg-border p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-bg-border">
                <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">访客预约登记</h3>
                  <p className="text-sm text-gray-500">请填写访客信息，系统将自动发起审批流程</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-success mb-4 flex items-center gap-2">
                    <IdCard className="w-4 h-4" />
                    访客基本信息
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">访客姓名 *</label>
                      <input
                        required
                        type="text"
                        value={form.visitorName}
                        onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all"
                        placeholder="请输入真实姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">身份证号 *</label>
                      <input
                        required
                        type="text"
                        value={form.idCardNo}
                        onChange={(e) => setForm({ ...form, idCardNo: e.target.value })}
                        maxLength={18}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all font-mono"
                        placeholder="请输入18位身份证号"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">联系电话 *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          required
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all"
                          placeholder="请输入手机号码"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">与校内人员关系 *</label>
                      <select
                        value={form.relation}
                        onChange={(e) => setForm({ ...form, relation: e.target.value as VisitorRelation })}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-success/50 input-glow transition-all cursor-pointer"
                      >
                        {relations.map((r) => (
                          <option key={r} value={r} className="bg-bg-card">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-warning mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    来访时间安排
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">来访日期 *</label>
                      <input
                        required
                        type="date"
                        value={form.visitDate}
                        onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-success/50 input-glow transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">开始时间 *</label>
                      <input
                        required
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-success/50 input-glow transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">结束时间 *</label>
                      <input
                        required
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-success/50 input-glow transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-primary-300 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    访问目的地
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">访问类型 *</label>
                      <select
                        value={form.targetType}
                        onChange={(e) => setForm({ ...form, targetType: e.target.value as Visitor['targetType'] })}
                        className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-success/50 input-glow transition-all cursor-pointer"
                      >
                        <option value="STUDENT" className="bg-bg-card">探访学生</option>
                        <option value="TEACHER" className="bg-bg-card">约见教师</option>
                        <option value="OFFICE" className="bg-bg-card">公务办公</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {form.targetType === 'STUDENT' ? '学生姓名及班级 *' : form.targetType === 'TEACHER' ? '教师姓名 *' : '对接部门 *'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          required
                          type="text"
                          value={form.targetName}
                          onChange={(e) => setForm({ ...form, targetName: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all"
                          placeholder="请输入姓名/部门"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-300 mb-2">来访事由 *</label>
                    <textarea
                      required
                      rows={3}
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-bg-light border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all resize-none"
                      placeholder="请详细说明来访事由，便于审批及安全管理..."
                    ></textarea>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
                  <Eye className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning/90">
                    <p className="font-medium mb-1">隐私安全提示</p>
                    <p className="text-xs opacity-90">
                      您的身份信息将被加密存储，仅用于本次身份核验。访问期间您的行动轨迹将被安全记录，访问结束后自动脱敏。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm({
                      visitorName: '', idCardNo: '', phone: '', relation: '父亲',
                      visitDate: new Date().toISOString().split('T')[0],
                      startTime: '09:00', endTime: '11:00',
                      purpose: '', targetType: 'STUDENT', targetName: '',
                    })}
                    className="px-6 py-3 rounded-xl bg-bg-lighter border border-bg-border text-gray-400 hover:text-white transition-all font-medium"
                  >
                    重置表单
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white font-semibold hover:shadow-xl hover:shadow-success/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    提交预约申请
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
                <div className="p-5 border-b border-bg-border bg-gradient-to-r from-success/10 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold">二维码通行</h3>
                      <p className="text-xs text-gray-500">批准后自动生成</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-bg-light/50 to-bg">
                  <div className="w-40 h-40 rounded-2xl bg-white p-2 mb-4 shadow-xl">
                    <div className="w-full h-full rounded-xl bg-bg" style={{
                      backgroundImage: `
                        linear-gradient(45deg, #0D1117 25%, transparent 25%),
                        linear-gradient(-45deg, #0D1117 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #0D1117 75%),
                        linear-gradient(-45deg, transparent 75%, #0D1117 75%)
                      `,
                      backgroundSize: '12px 12px',
                      backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                    }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-bg" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center mb-1">审批通过后将生成动态通行码</p>
                  <p className="text-xs text-success font-mono">QR-XXXXXXXXXXXX</p>
                </div>
              </div>

              <div className="rounded-2xl bg-bg-card border border-bg-border p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  预约流程说明
                </h3>
                <div className="space-y-3.5">
                  {[
                    { step: 1, title: '提交预约', desc: '填写访客信息及访问事由', color: 'primary' },
                    { step: 2, title: '审批流转', desc: '班主任/部门/校长分级审批', color: 'warning' },
                    { step: 3, title: '生成凭证', desc: '批准后自动生成通行二维码', color: 'success' },
                    { step: 4, title: '扫码入校', desc: '门卫核验身份及二维码', color: 'primary' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-lg bg-${item.color}/20 text-${item.color} font-bold text-sm flex items-center justify-center flex-shrink-0`}>
                          {item.step}
                        </div>
                        {i < 3 && <div className="w-px flex-1 bg-bg-border my-1"></div>}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-bg-card border border-bg-border p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索访客/被访人..."
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow w-60"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
                  className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-success/50 input-glow cursor-pointer"
                >
                  <option value="all" className="bg-bg-card">全部状态</option>
                  <option value="PENDING_L1" className="bg-bg-card">待L1审批</option>
                  <option value="PENDING_L2" className="bg-bg-card">待L2审批</option>
                  <option value="APPROVED" className="bg-bg-card">已批准</option>
                  <option value="REJECTED" className="bg-bg-card">已拒绝</option>
                  <option value="EXECUTED" className="bg-bg-card">已完成</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                共 <span className="text-white font-semibold">{filteredVisitors.length}</span> 条记录
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="rounded-2xl bg-bg-card border border-bg-border p-5 card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/25 to-primary/15 flex items-center justify-center border border-success/30">
                        <User className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{visitor.visitorName}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-bg-lighter text-gray-400">
                            {visitor.relation}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{visitor.idCardNo}</div>
                      </div>
                    </div>
                    <span className={`badge ${statusConfig[visitor.status].className}`}>
                      {statusConfig[visitor.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-bg-light/50">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">访问日期</div>
                      <div className="text-sm flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-success" />
                        {visitor.visitDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">时间段</div>
                      <div className="text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-warning" />
                        {visitor.startTime} - {visitor.endTime}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-gray-500 mb-1">被访人</div>
                      <div className="text-sm flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary-300" />
                        {visitor.targetName}
                      </div>
                    </div>
                    {visitor.targetLocation && (
                      <div className="col-span-2">
                        <div className="text-[10px] text-gray-500 mb-1">具体位置</div>
                        <div className="text-sm flex items-center gap-1.5 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-danger" />
                          {visitor.targetLocation}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                    <div className="text-[10px] text-gray-500 mb-1">来访事由</div>
                    <p className="text-sm text-gray-300 line-clamp-2">{visitor.purpose}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                    <div className="text-xs text-gray-500">
                      申请于 {new Date(visitor.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="flex gap-2">
                      {visitor.qrCodeToken && (
                        <button
                          onClick={() => setShowQR(visitor)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-all flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" />
                          通行码
                        </button>
                      )}
                      {visitor.status.startsWith('PENDING') && (
                        <>
                          <button className="px-3 py-1.5 rounded-lg text-xs bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            拒绝
                          </button>
                          <button className="px-3 py-1.5 rounded-lg text-xs bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-all flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            通过
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-bg-card border border-bg-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold mb-1">访客通行码</h3>
              <p className="text-xs text-gray-500">{showQR.visitorName} · {showQR.visitDate}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 mb-5">
              <div className="aspect-square rounded-xl bg-bg p-6 relative overflow-hidden">
                <div className="w-full h-full rounded-lg bg-white" style={{
                  backgroundImage: `radial-gradient(circle, #0D1117 2px, transparent 2px)`,
                  backgroundSize: '10px 10px',
                }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-xl">
                      <QrCode className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-success rounded-tl-xl"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-success rounded-tr-xl"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-success rounded-bl-xl"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-success rounded-br-xl"></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-success/10 border border-success/30 mb-5 text-center">
              <div className="text-xs text-gray-500 mb-1">通行凭证编号</div>
              <div className="font-mono font-bold text-success">{showQR.qrCodeToken}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-2.5 rounded-lg bg-bg-light/80">
                <div className="text-gray-500 mb-1">有效日期</div>
                <div className="font-medium text-white">{showQR.visitDate}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-light/80">
                <div className="text-gray-500 mb-1">有效时段</div>
                <div className="font-medium text-white">{showQR.startTime} ~ {showQR.endTime}</div>
              </div>
            </div>

            <button
              onClick={() => setShowQR(null)}
              className="w-full py-3 rounded-xl btn-primary text-white font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
