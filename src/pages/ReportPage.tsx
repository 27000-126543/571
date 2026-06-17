import { useState } from 'react';
import Layout from '../components/Layout';
import {
  FileSpreadsheet,
  CalendarDays,
  Download,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wrench,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
  Share2,
} from 'lucide-react';
import apiClient from '../api/client';

const today = new Date().toISOString().split('T')[0];

export default function ReportPage() {
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/reports/daily/export', {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data as unknown as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily-report-${startDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const blob = new Blob(['报表数据占位'], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `智慧校园报表_${startDate}_${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const stats = [
    {
      label: '平均出勤率',
      value: '97.8%',
      sub: '↑ 较上周 +1.2%',
      icon: Users,
      color: 'success',
    },
    {
      label: '食堂总营收',
      value: '¥186,420',
      sub: '日均 ¥26,631',
      icon: UtensilsCrossed,
      color: 'warning',
    },
    {
      label: '工单完成率',
      value: '92.3%',
      sub: '143 / 155 完成',
      icon: Wrench,
      color: 'primary',
    },
    {
      label: '安全事件',
      value: '2 起',
      sub: '↓ 较上月 -3 起',
      icon: AlertTriangle,
      color: 'danger',
    },
  ];

  const gradeAttendance = [
    { grade: '一年级', className: '1-6班', total: 240, present: 235, rate: 97.9 },
    { grade: '二年级', className: '1-6班', total: 235, present: 231, rate: 98.3 },
    { grade: '三年级', className: '1-6班', total: 248, present: 242, rate: 97.6 },
    { grade: '四年级', className: '1-5班', total: 210, present: 205, rate: 97.6 },
    { grade: '五年级', className: '1-5班', total: 205, present: 200, rate: 97.6 },
    { grade: '六年级', className: '1-5班', total: 198, present: 193, rate: 97.5 },
  ];

  const topDishes = [
    { name: '红烧肉盖饭', sold: 1245, revenue: 18675, trend: 'up' },
    { name: '蜜汁鸡排饭', sold: 1180, revenue: 18880, trend: 'up' },
    { name: '番茄牛腩面', sold: 986, revenue: 17748, trend: 'up' },
    { name: '清炒时蔬', sold: 1520, revenue: 12160, trend: 'down' },
    { name: '手工水饺', sold: 1056, revenue: 12672, trend: 'up' },
  ];

  const deviceTypes = [
    { type: '投影仪', total: 68, fault: 3, name: 'PROJECTOR' as const },
    { type: '空调系统', total: 156, fault: 8, name: 'AIR_CONDITION' as const },
    { type: '计算机', total: 320, fault: 15, name: 'COMPUTER' as const },
    { type: '监控设备', total: 88, fault: 2, name: 'CCTV' as const },
    { type: '智能黑板', total: 62, fault: 1, name: 'BLACKBOARD' as const },
    { type: '门禁系统', total: 24, fault: 0, name: 'ACCESS_DOOR' as const },
  ];

  const maxSold = Math.max(...topDishes.map(d => d.sold));
  const maxDevices = Math.max(...deviceTypes.map(d => d.total));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="w-7 h-7 text-warning" />
              数据报表中心
            </h2>
            <p className="text-gray-500 mt-1">多维度数据统计分析 · 智能报表导出</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex p-1 rounded-xl bg-bg-card border border-bg-border">
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    reportType === type
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type === 'daily' ? '日报' : type === 'weekly' ? '周报' : '月报'}
                </button>
              ))}
            </div>
            <button className="p-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all">
              <Printer className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-warning/10 via-bg-card to-primary/10 border border-bg-border p-5 lg:p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">统计时间范围</h3>
                <p className="text-xs text-gray-500">选择报表的统计周期</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-warning to-amber-600 text-white font-semibold hover:shadow-xl hover:shadow-warning/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>正在导出...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>导出 Excel</span>
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-warning/50 input-glow transition-all"
              />
            </div>
            <div className="text-center pb-2.5 px-2">
              <div className="text-2xl font-orbitron text-gray-500">~</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-light border border-bg-border text-white focus:outline-none focus:border-warning/50 input-glow transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl bg-gradient-to-br from-${s.color}/15 to-transparent border border-${s.color}/30 backdrop-blur card-hover`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${s.color}/20 flex items-center justify-center`}>
                  <s.icon className={`w-6 h-6 text-${s.color}`} />
                </div>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  本期
                </span>
              </div>
              <div className={`text-3xl font-bold font-orbitron text-${s.color} mb-1`}>
                {s.value}
              </div>
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="mt-3 pt-3 border-t border-bg-border/50 text-xs text-gray-400">
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
          <div className="p-5 border-b border-bg-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <h3 className="font-semibold">数据可视化图表</h3>
                  <p className="text-xs text-gray-500">多维度数据分析（预留 3D 图表区域）</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2">
            <div className="p-6 border-b xl:border-b-0 xl:border-r border-bg-border">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-success" />
                各年级出勤率统计
              </h4>
              <div className="space-y-3.5">
                {gradeAttendance.map((g, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="text-gray-400">{g.grade} {g.className}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500">{g.present}/{g.total}人</span>
                        <span className={`font-bold font-orbitron ${
                          g.rate >= 98 ? 'text-success' : g.rate >= 95 ? 'text-warning' : 'text-danger'
                        }`}>
                          {g.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-7 rounded-xl bg-bg-lighter overflow-hidden relative">
                      <div
                        className={`h-full rounded-xl progress-bar bg-gradient-to-r ${
                          g.rate >= 98
                            ? 'from-success to-emerald-400'
                            : g.rate >= 95
                            ? 'from-warning to-amber-400'
                            : 'from-danger to-rose-400'
                        }`}
                        style={{ width: `${g.rate}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-warning" />
                热销菜品排行榜
              </h4>
              <div className="space-y-3">
                {topDishes.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg-light/40 hover:bg-bg-light/60 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-gradient-to-br from-warning to-amber-500 text-white' :
                          i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                          i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
                          'bg-bg-lighter text-gray-400'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-sm">{d.name}</span>
                        {d.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-success" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-danger rotate-180" />
                        )}
                      </div>
                      <span className="text-sm font-orbitron text-warning">¥{d.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-bg-lighter overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-warning to-amber-400 progress-bar"
                          style={{ width: `${(d.sold / maxSold) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{d.sold} 份</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-bg-border p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-300" />
              设备状态概览
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {deviceTypes.map((dt, i) => (
                <div key={i} className="p-4 rounded-xl bg-bg-light/50 border border-bg-border hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">{dt.type}</span>
                    <span className={`badge ${dt.fault === 0 ? 'badge-success' : dt.fault < 5 ? 'badge-warning' : 'badge-danger'}`}>
                      {dt.fault === 0 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {dt.fault === 0 ? '正常' : `${dt.fault}故障`}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-orbitron font-bold text-primary-300">{dt.total}</span>
                    <span className="text-xs text-gray-500">台</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-lighter overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-success progress-bar"
                      style={{ width: `${((dt.total - dt.fault) / maxDevices) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center justify-between">
                    <span>正常: {dt.total - dt.fault}</span>
                    <span>完好率: {Math.round(((dt.total - dt.fault) / dt.total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-bg-border relative h-[250px] bg-gradient-to-br from-primary/5 via-bg to-warning/5 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `linear-gradient(rgba(46, 196, 182, 0.06) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(46, 196, 182, 0.06) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}></div>
            <div className="relative z-10 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-success/60" />
              <h4 className="text-lg font-bold mb-1">图表可视化区域</h4>
              <p className="text-gray-500 text-sm max-w-md">
                此处将接入 ECharts/Three.js 等图表库，展示趋势折线、饼图、3D柱图等丰富可视化
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-bg-card/80 border border-bg-border text-gray-400">折线趋势图</span>
                <span className="text-xs px-3 py-1.5 rounded-lg bg-bg-card/80 border border-bg-border text-gray-400">占比饼图</span>
                <span className="text-xs px-3 py-1.5 rounded-lg bg-bg-card/80 border border-bg-border text-gray-400">热力地图</span>
                <span className="text-xs px-3 py-1.5 rounded-lg bg-bg-card/80 border border-bg-border text-gray-400">3D柱图</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
          <div className="p-5 border-b border-bg-border flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">报表导出中心</h3>
                <p className="text-xs text-gray-500">支持多种格式与数据维度</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '每日运营日报', desc: '出勤、食堂、设备等核心指标', icon: FileSpreadsheet, color: 'warning' },
              { title: '月度汇总报表', desc: '全月数据对比与趋势分析', icon: BarChart3, color: 'primary' },
              { title: '学生考勤明细', desc: '按班级/学生维度导出', icon: Users, color: 'success' },
              { title: '工单维修记录', desc: '含费用、时效、满意度', icon: Wrench, color: 'danger' },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-gradient-to-br from-bg-light/80 to-bg-light/30 border border-bg-border hover:border-primary/30 card-hover cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-${item.color}/15 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}`} />
                </div>
                <h4 className="font-semibold mb-1.5">{item.title}</h4>
                <p className="text-xs text-gray-500 mb-4">{item.desc}</p>
                <div className="flex items-center gap-1 text-xs text-primary-300 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  上次生成: 昨天 18:00
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
