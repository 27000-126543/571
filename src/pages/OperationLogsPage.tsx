import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  History,
  Search,
  Filter,
  CalendarDays,
  User,
  Shield,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Network,
  Building2,
  Library,
  UtensilsCrossed,
  Bus,
  UserCheck,
  Wrench,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  Settings,
} from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';
import type { OperationLog, UserRole, ApiResponse, PageResponse } from '../../shared/types';

const moduleConfig: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  教学管理: { label: '教学管理', icon: Building2, color: 'primary' },
  图书馆: { label: '图书馆', icon: Library, color: 'warning' },
  食堂管理: { label: '食堂管理', icon: UtensilsCrossed, color: 'danger' },
  校车调度: { label: '校车调度', icon: Bus, color: 'primary' },
  访客系统: { label: '访客系统', icon: UserCheck, color: 'success' },
  设备工单: { label: '设备工单', icon: Wrench, color: 'warning' },
  审批中心: { label: '审批中心', icon: ClipboardList, color: 'primary' },
  报表统计: { label: '报表统计', icon: FileSpreadsheet, color: 'warning' },
  系统管理: { label: '系统管理', icon: Settings, color: 'primary' },
  登录登出: { label: '登录登出', icon: LogOut, color: 'success' },
};

const roleLabels: Record<UserRole, string> = {
  student: '学生', teacher: '教师', head_teacher: '班主任',
  logistics_director: '后勤主任', moral_director: '德育主任',
  principal: '校长', parent: '家长',
};

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILURE'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (moduleFilter !== 'all') params.set('module', moduleFilter);

      const res = await apiClient.get<ApiResponse<PageResponse<OperationLog>>>(
        `/logs?${params.toString()}`
      );
      if (res.data.code === 0 && res.data.data) {
        setLogs(res.data.data.list);
        setTotal(res.data.data.total);
      }
    } catch (e) {
      console.error('获取操作日志失败:', e);
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (searchText) {
      const s = searchText.toLowerCase();
      if (!log.userName.toLowerCase().includes(s) &&
          !log.action.toLowerCase().includes(s) &&
          !(log.detail || '').toLowerCase().includes(s) &&
          !log.ipAddress.includes(s)) return false;
    }
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (roleFilter !== 'all' && log.userRole !== roleFilter) return false;
    if (startDate && new Date(log.createdAt) < new Date(startDate)) return false;
    if (endDate && new Date(log.createdAt) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const failureCount = logs.filter(l => l.status === 'FAILURE').length;
  const uniqueUsers = new Set(logs.map(l => l.userId)).size;

  const stats = [
    { label: '总操作数', value: total, icon: History, color: 'primary' },
    { label: '成功操作', value: successCount, icon: CheckCircle, color: 'success' },
    { label: '失败操作', value: failureCount, icon: XCircle, color: 'danger' },
    { label: '操作用户', value: uniqueUsers, icon: User, color: 'warning' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <History className="w-7 h-7 text-primary-300" />
              操作日志审计
            </h2>
            <p className="text-gray-500 mt-1">全量操作记录 · 安全审计追踪 · 不可篡改</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white font-medium">
              <Download className="w-4 h-4" />
              导出日志
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br from-${s.color}/15 to-transparent border border-${s.color}/30 backdrop-blur`}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 text-${s.color}`} />
                <span className={`text-2xl font-bold font-orbitron text-${s.color}`}>{s.value}</span>
              </div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-bg-card border border-bg-border p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Filter className="w-4 h-4" />
              <span>筛选条件：</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="xl:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索用户/操作/详情/IP..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 input-glow transition-all"
              />
            </div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-primary/50 input-glow transition-all cursor-pointer"
            >
              <option value="all">全部模块</option>
              {Object.keys(moduleConfig).map(m => (
                <option key={m} value={m} className="bg-bg-card">{m}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'SUCCESS' | 'FAILURE')}
              className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-primary/50 input-glow transition-all cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="SUCCESS">成功</option>
              <option value="FAILURE">失败</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-sm text-white focus:outline-none focus:border-primary/50 input-glow transition-all cursor-pointer"
            >
              <option value="all">全部角色</option>
              {(Object.entries(roleLabels) as [UserRole, string][]).map(([k, v]) => (
                <option key={k} value={k} className="bg-bg-card">{v}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 rounded-xl bg-bg-light border border-bg-border text-xs text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <span className="text-gray-500">-</span>
              <div className="relative flex-1">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 rounded-xl bg-bg-light border border-bg-border text-xs text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-bg-border/50 flex items-center justify-between text-xs text-gray-500">
            <span>
              当前筛选：共 <span className="text-white font-semibold">{filteredLogs.length}</span> 条记录
            </span>
            <button
              onClick={() => {
                setSearchText(''); setModuleFilter('all'); setStatusFilter('all');
                setRoleFilter('all'); setStartDate(''); setEndDate('');
              }}
              className="text-primary-300 hover:text-primary-200 hover:underline transition-colors"
            >
              重置筛选条件
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-lighter/50 sticky top-0 z-10 backdrop-blur">
                <tr className="text-xs text-gray-500">
                  <th className="text-left py-3 px-4 font-medium w-10"></th>
                  <th className="text-left py-3 px-4 font-medium">时间</th>
                  <th className="text-left py-3 px-4 font-medium">模块</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                  <th className="text-left py-3 px-4 font-medium">操作用户</th>
                  <th className="text-left py-3 px-4 font-medium">IP 地址</th>
                  <th className="text-left py-3 px-4 font-medium">状态</th>
                  <th className="text-left py-3 px-4 font-medium">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {filteredLogs.map((log) => {
                  const modCfg = moduleConfig[log.module];
                  const Icon = modCfg?.icon || FileText;
                  const isExpanded = expandedLog === log.id;
                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="table-row cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-gray-500" />
                            : <ChevronDown className="w-4 h-4 text-gray-500" />
                          }
                        </td>
                        <td className="py-3 px-4">
                          <div className="whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-300">
                              {new Date(log.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                            <div className="text-[11px] text-gray-600 font-mono">
                              {new Date(log.createdAt).toLocaleTimeString('zh-CN')}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-${modCfg?.color || 'primary'}/10 text-${modCfg?.color || 'primary'}-300 border border-${modCfg?.color || 'primary'}/20`}>
                            <Icon className="w-3 h-3" />
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-sm">{log.action}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-success flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{log.userName}</div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                {roleLabels[log.userRole] || log.userRole}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-mono text-gray-400">{log.ipAddress}</div>
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'SUCCESS' ? (
                            <span className="badge badge-success flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              成功
                            </span>
                          ) : (
                            <span className="badge badge-danger flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              失败
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-sm text-gray-400 truncate">
                            <Eye className="w-3.5 h-3.5 inline mr-1.5 text-gray-500" />
                            {log.detail}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-primary/5 border-t border-b border-primary/10">
                          <td colSpan={8} className="py-0">
                            <div className="p-5 lg:p-6">
                              <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm text-primary-300">
                                <Network className="w-4 h-4" />
                                完整操作详情
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                <div className="p-3 rounded-xl bg-bg-light/60">
                                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">请求ID</div>
                                  <div className="text-sm font-mono">{log.id.toUpperCase()}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-bg-light/60">
                                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">操作时间</div>
                                  <div className="text-sm font-mono">
                                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-bg-light/60">
                                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">模块 / 动作</div>
                                  <div className="text-sm">
                                    <span className="text-primary-300">{log.module}</span>
                                    <span className="text-gray-600 mx-2">→</span>
                                    <span className="font-medium">{log.action}</span>
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-bg-light/60">
                                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">操作用户</div>
                                  <div className="text-sm">
                                    {log.userName}
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({roleLabels[log.userRole]})
                                    </span>
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-bg-light/60">
                                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">来源 IP</div>
                                  <div className="text-sm font-mono text-gray-400">{log.ipAddress}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-bg-light/60">
                                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">操作结果</div>
                                  <div>
                                    {log.status === 'SUCCESS'
                                      ? <span className="badge badge-success">操作成功</span>
                                      : <span className="badge badge-danger">操作失败</span>
                                    }
                                  </div>
                                </div>
                                {log.targetName && (
                                  <div className="p-3 rounded-xl bg-bg-light/60 md:col-span-2">
                                    <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">操作对象</div>
                                    <div className="text-sm">
                                      <span className="text-gray-400">目标:</span> {log.targetName}
                                      {log.targetId && (
                                        <span className="text-xs text-gray-600 font-mono ml-2">[{log.targetId}]</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div className="p-3 rounded-xl bg-bg-light/60">
                                    <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">客户端</div>
                                    <div className="text-xs text-gray-400">{log.userAgent}</div>
                                  </div>
                                )}
                                <div className={`p-4 rounded-xl md:col-span-3 border ${
                                  log.status === 'SUCCESS'
                                    ? 'bg-success/5 border-success/20'
                                    : 'bg-danger/5 border-danger/20'
                                }`}>
                                  <div className={`text-[10px] mb-1.5 uppercase tracking-wider ${
                                    log.status === 'SUCCESS' ? 'text-success' : 'text-danger'
                                  }`}>
                                    操作详情描述
                                  </div>
                                  <div className={`text-sm ${log.status === 'SUCCESS' ? 'text-gray-300' : 'text-gray-200'}`}>
                                    {log.detail}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-20">
                      <div className="text-center">
                        <History className="w-14 h-14 mx-auto mb-4 text-gray-700 opacity-50" />
                        <p className="text-gray-500 mb-2">没有匹配的日志记录</p>
                        <p className="text-xs text-gray-600">请尝试调整筛选条件</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
