import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BusScene } from '../components/scenes3d';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  CreditCard,
  Navigation,
  Radio,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';
import type { Bus as BusType, BusAnomaly, ApiResponse } from '../../shared/types';

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  ON_ROUTE: { label: '行驶中', className: 'badge-success', dot: 'bg-success animate-pulse' },
  AT_STATION: { label: '靠站中', className: 'badge-primary', dot: 'bg-primary-300' },
  AT_SCHOOL: { label: '已到校', className: 'badge-success', dot: 'bg-success' },
  MAINTENANCE: { label: '维修中', className: 'badge-warning', dot: 'bg-warning' },
  DELAYED: { label: '延误', className: 'badge-danger', dot: 'bg-danger animate-pulse' },
};

const severityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: '低', className: 'badge-primary' },
  MEDIUM: { label: '中', className: 'badge-warning' },
  HIGH: { label: '高', className: 'badge-danger' },
  CRITICAL: { label: '紧急', className: 'badge-danger' },
};

function formatEstimatedArrival(iso: string): string {
  if (!iso) return '计算中';
  const diff = dayjs(iso).diff(dayjs(), 'minute');
  if (diff <= 0) return '即将到达';
  if (diff < 60) return `${diff} 分钟后`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}小时${mins}分钟后`;
}

export default function BusPage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [anomalies, setAnomalies] = useState<BusAnomaly[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusType | null>(null);
  const [swipingCardId, setSwipingCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBuses = async () => {
    try {
      const res = await apiClient.get<ApiResponse<BusType[]>>('/buses');
      if (res.data.code === 0 && res.data.data) {
        setBuses(res.data.data);
        if (!selectedBus && res.data.data.length > 0) {
          setSelectedBus(res.data.data[0]);
          setActiveTab(res.data.data[0].id);
        } else if (selectedBus) {
          const updated = res.data.data.find(b => b.id === selectedBus.id);
          if (updated) setSelectedBus(updated);
        }
      }
    } catch (e) {
      console.error('获取校车列表失败:', e);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const res = await apiClient.get<ApiResponse<BusAnomaly[]>>('/buses/anomalies');
      if (res.data.code === 0 && res.data.data) {
        setAnomalies(res.data.data);
      }
    } catch (e) {
      console.error('获取异常列表失败:', e);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchBuses(), fetchAnomalies()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBuses();
    fetchAnomalies();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBuses();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedBus?.id]);

  const handleTabChange = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      setSelectedBus(bus);
      setActiveTab(busId);
    }
  };

  const handleCardSwipe = () => {
    if (!selectedBus) return;
    setSwipingCardId(selectedBus.id);
    setTimeout(() => setSwipingCardId(null), 1500);
  };

  const handleSelectBus = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      setSelectedBus(bus);
      setActiveTab(busId);
    }
  };

  const selectedBusAnomalies = selectedBus
    ? anomalies.filter(a => a.busId === selectedBus.id)
    : [];

  if (!selectedBus) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">加载校车数据中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Bus className="w-7 h-7 text-primary-300" />
              校车智能调度
            </h2>
            <p className="text-gray-500 mt-1">实时车辆定位 · 异常预警 · 刷卡乘车</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>刷新位置</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[
            { label: '运行中车辆', value: buses.filter(b => b.status === 'ON_ROUTE').length, color: 'success', icon: Bus },
            { label: '在站车辆', value: buses.filter(b => b.status === 'AT_STATION' || b.status === 'AT_SCHOOL').length, color: 'primary', icon: MapPin },
            { label: '乘车学生', value: buses.reduce((a, b) => a + b.currentOccupancy, 0), color: 'warning', icon: Users },
            { label: '异常事件', value: anomalies.filter(a => a.status !== 'RESOLVED').length, color: 'danger', icon: AlertTriangle },
            { label: '总车辆', value: buses.length, color: 'primary', icon: Activity },
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

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex p-1 rounded-xl bg-bg-card border border-bg-border mb-4">
              {buses.map((bus) => (
                <button
                  key={bus.id}
                  onClick={() => handleTabChange(bus.id)}
                  className={`flex-1 py-3 px-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                    activeTab === bus.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-gray-400 hover:text-white hover:bg-bg-lighter'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[bus.status].dot}`}></span>
                  <span className="truncate">{bus.busNumber}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700/50" style={{ height: 'calc(100vh - 180px)' }}>
              <BusScene
                buses={buses}
                selectedBusId={selectedBus.id}
                onSelectBus={handleSelectBus}
              />
            </div>
          </div>

          <div className="w-80 flex-shrink-0 space-y-4">
            <div className="rounded-2xl bg-bg-card border border-success/30 p-4 shadow-lg shadow-success/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-success flex items-center gap-2 text-sm">
                  <Radio className="w-4 h-4 animate-pulse" />
                  当前选中车辆
                </h3>
              </div>

              <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-bg-light/50">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Bus className="w-6 h-6 text-success" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base truncate">{selectedBus.busNumber}</div>
                  <div className="text-xs text-gray-500 truncate">{selectedBus.plateNumber}</div>
                  <span className={`badge ${statusConfig[selectedBus.status].className} mt-0.5 text-[10px]`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${statusConfig[selectedBus.status].dot}`}></span>
                    {statusConfig[selectedBus.status].label}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-bg-border/50">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> 当前位置
                  </span>
                  <span className="text-right">
                    {selectedBus.nextStation}
                    {selectedBus.currentPosition.speed > 0 && (
                      <div className="text-[10px] text-success">{selectedBus.currentPosition.speed} km/h</div>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-bg-border/50">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" /> 线路
                  </span>
                  <span>{selectedBus.routeName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-bg-border/50">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> 预计到达
                  </span>
                  <span className={selectedBus.status === 'DELAYED' ? 'text-danger' : 'text-success'}>
                    {formatEstimatedArrival(selectedBus.estimatedArrival)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-bg-border/50">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 乘车人数
                  </span>
                  <span>
                    <span className="font-bold text-warning">{selectedBus.currentOccupancy}</span>
                    <span className="text-gray-500"> / {selectedBus.capacity}</span>
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> 司机
                  </span>
                  <div className="text-right">
                    <div>{selectedBus.driverName}</div>
                    <div className="text-[10px] text-primary-300 flex items-center gap-1 justify-end">
                      <Phone className="w-2.5 h-2.5" />
                      {selectedBus.driverPhone}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCardSwipe}
                disabled={selectedBus.status === 'MAINTENANCE'}
                className={`w-full py-2.5 mt-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  swipingCardId === selectedBus.id
                    ? 'bg-success text-white animate-pulse'
                    : 'btn-primary text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <CreditCard className={`w-4 h-4 ${swipingCardId === selectedBus.id ? 'animate-bounce' : ''}`} />
                {swipingCardId === selectedBus.id ? '刷卡成功 ✅' : '模拟学生刷卡乘车'}
              </button>
            </div>

            <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
              <div className="p-3 border-b border-bg-border flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">乘车学生</h3>
                  <p className="text-[10px] text-gray-500">{selectedBus.onboardStudents?.length || 0} 人</p>
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {(selectedBus.onboardStudents?.length || 0) > 0 ? (
                  selectedBus.onboardStudents?.map((student, i) => (
                    <div
                      key={student.studentId}
                      className="p-2.5 border-b border-bg-border/50 last:border-0 hover:bg-bg-light/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">{student.studentName}</div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {student.grade}年级{student.className}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>暂无乘车学生数据</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
              <div className="p-3 border-b border-bg-border flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-danger/20 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">异常事件</h3>
                  <p className="text-[10px] text-gray-500">{selectedBusAnomalies.length} 条</p>
                </div>
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {selectedBusAnomalies.length > 0 ? (
                  selectedBusAnomalies.map((anomaly) => (
                    <div key={anomaly.id} className="p-2.5 border-b border-bg-border/50 last:border-0 hover:bg-bg-light/30 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL' ? 'bg-danger/20' :
                          anomaly.severity === 'MEDIUM' ? 'bg-warning/20' : 'bg-primary/20'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL' ? 'text-danger' :
                            anomaly.severity === 'MEDIUM' ? 'text-warning' : 'text-primary-300'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`badge ${severityConfig[anomaly.severity].className} text-[9px]`}>
                              {severityConfig[anomaly.severity].label}
                            </span>
                            <span className={`badge text-[9px] ${
                              anomaly.status === 'RESOLVED' ? 'badge-success' :
                              anomaly.status === 'HANDLING' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {anomaly.status === 'RESOLVED' ? '已解决' :
                               anomaly.status === 'HANDLING' ? '处理中' : '待处理'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2">{anomaly.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-xs">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success/50" />
                    <p>该车无异常事件</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
