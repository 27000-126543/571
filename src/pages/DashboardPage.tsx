import { useState } from 'react';
import Layout from '../components/Layout';
import { CampusScene } from '../components/scenes3d';
import {
  Users,
  Building2,
  UtensilsCrossed,
  Bus,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Activity,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AlertItem } from '../../shared/types';

const kpiCards = [
  {
    title: '今日出勤',
    value: '98.6%',
    subValue: '1,972 / 2,000',
    icon: Users,
    trend: '+1.2%',
    trendUp: true,
    color: 'success',
    gradient: 'from-success/20 to-emerald-500/10',
    border: 'border-success/30',
  },
  {
    title: '教室使用率',
    value: '87.3%',
    subValue: '52 / 60 间在用',
    icon: Building2,
    trend: '+5.8%',
    trendUp: true,
    color: 'primary',
    gradient: 'from-primary/30 to-blue-500/10',
    border: 'border-primary/30',
  },
  {
    title: '食堂就餐',
    value: '2,341',
    subValue: '今日累计人次',
    icon: UtensilsCrossed,
    trend: '-3.2%',
    trendUp: false,
    color: 'warning',
    gradient: 'from-warning/20 to-amber-500/10',
    border: 'border-warning/30',
  },
  {
    title: '运行校车',
    value: '18',
    subValue: '20 辆在线',
    icon: Bus,
    trend: '+2',
    trendUp: true,
    color: 'primary',
    gradient: 'from-primary/20 to-indigo-500/10',
    border: 'border-primary/30',
  },
  {
    title: '待处理工单',
    value: '23',
    subValue: '7 个紧急',
    icon: Wrench,
    trend: '-5',
    trendUp: true,
    color: 'danger',
    gradient: 'from-danger/20 to-rose-500/10',
    border: 'border-danger/30',
  },
];

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'DEVICE_FAULT',
    severity: 'HIGH',
    title: '教学楼B302投影仪故障',
    description: '设备无法正常开机，等待维修人员处理',
    time: '5分钟前',
    handled: false,
  },
  {
    id: '2',
    type: 'BUS_ANOMALY',
    severity: 'MEDIUM',
    title: '3号校车延误预警',
    description: '预计到达时间晚于计划15分钟',
    time: '12分钟前',
    handled: false,
  },
  {
    id: '3',
    type: 'STOCK_LOW',
    severity: 'MEDIUM',
    title: '食堂库存告警',
    description: '大米、食用油库存低于安全阈值',
    time: '28分钟前',
    handled: false,
  },
  {
    id: '4',
    type: 'APPROVAL_TODO',
    severity: 'LOW',
    title: '采购单待审批',
    description: '后勤提交的设备采购单等待您的审批',
    time: '1小时前',
    handled: false,
  },
  {
    id: '5',
    type: 'CONFLICT',
    severity: 'HIGH',
    title: '排课冲突检测',
    description: '教学楼A201 周三3-4节存在课程分配冲突',
    time: '2小时前',
    handled: true,
  },
];

const severityColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  LOW: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary-300', icon: 'bg-primary' },
  MEDIUM: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: 'bg-warning' },
  HIGH: { bg: 'bg-danger/10', border: 'border-danger/30', text: 'text-danger', icon: 'bg-danger' },
  CRITICAL: { bg: 'bg-danger/20', border: 'border-danger/50', text: 'text-danger', icon: 'bg-danger' },
};

export default function DashboardPage() {
  const [alerts] = useState<AlertItem[]>(mockAlerts);
  const [alertsExpanded, setAlertsExpanded] = useState(true);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">数据概览</h2>
            <p className="text-gray-500 mt-1">实时监控校园运行状态</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              系统运行正常
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {kpiCards.map((card, index) => (
            <div
              key={index}
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} backdrop-blur card-hover overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${card.color}/20 flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 text-${card.color}`} />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                      card.trendUp ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {card.trend}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">{card.title}</div>
                  <div className={`text-3xl font-bold font-orbitron text-${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-gray-500">{card.subValue}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700/50" style={{ height: 'calc(100vh - 140px)' }}>
              <CampusScene alerts={alerts} />
            </div>
          </div>

          <div className="w-80 rounded-2xl bg-bg-card border border-bg-border overflow-hidden flex flex-col flex-shrink-0">
            <button
              onClick={() => setAlertsExpanded(!alertsExpanded)}
              className="w-full p-5 border-b border-bg-border flex items-center justify-between hover:bg-bg-light/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">实时告警</h3>
                  <p className="text-xs text-gray-500">{alerts.filter(a => !a.handled).length} 条待处理</p>
                </div>
              </div>
              {alertsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {alertsExpanded && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alerts.map((alert) => {
                  const style = severityColors[alert.severity];
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl ${style.bg} border ${style.border} ${
                        alert.handled ? 'opacity-60' : ''
                      } transition-all hover:scale-[1.01]`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.icon} ${!alert.handled ? 'animate-pulse' : ''}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-medium text-sm ${alert.handled ? 'line-through' : ''}`}>
                              {alert.title}
                            </h4>
                            <span className={`text-xs flex-shrink-0 ${style.text}`}>
                              {alert.severity === 'HIGH' ? '高' : alert.severity === 'MEDIUM' ? '中' : '低'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{alert.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {alert.time}
                            </span>
                            {alert.handled ? (
                              <span className="text-xs text-success/80">已处理</span>
                            ) : (
                              <button className="text-xs text-success hover:underline flex items-center gap-1">
                                处理 <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-bg-card border border-bg-border p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="font-semibold">今日重要事项</h3>
                <p className="text-xs text-gray-500">需要关注的任务提醒</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title: '下午 14:00 教职工会议', type: '会议', time: '还有 3 小时' },
                { title: '食堂月度采购审批截止', type: '审批', time: '今天 18:00' },
                { title: '设备巡检计划执行', type: '任务', time: '本周五前' },
                { title: '校车安全检查', type: '安全', time: '明天 09:00' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-bg-light/50 border border-bg-border hover:border-success/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-primary/20 text-primary-300' :
                      i === 1 ? 'bg-warning/20 text-warning' :
                      i === 2 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                    }`}>
                      {item.type.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-success">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-bg-card border border-bg-border p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">本周运营趋势</h3>
                  <p className="text-xs text-gray-500">关键指标变化情况</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { name: '出勤率', current: 98.6, avg: 96.2, color: 'success' },
                { name: '教室利用率', current: 87.3, avg: 82.5, color: 'primary' },
                { name: '食堂满意度', current: 92.1, avg: 88.7, color: 'warning' },
                { name: '设备完好率', current: 95.4, avg: 93.8, color: 'success' },
                { name: '工单完成率', current: 89.2, avg: 85.1, color: 'primary' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold font-orbitron text-${item.color}`}>{item.current}%</span>
                      <span className="text-xs text-gray-500">均 {item.avg}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-bg-lighter overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-${item.color} to-${item.color}/60 progress-bar`}
                      style={{ width: `${item.current}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
