import dayjs from 'dayjs';
import {
  busRepository,
  busAnomalyRepository,
} from '../dataSource/index.js';
import type { Bus, BusAnomaly } from '../../shared/types.js';

interface RoutePoint {
  lat: number;
  lng: number;
  x: number;
  z: number;
  stationName?: string;
}

const BUS_ROUTES: Record<string, RoutePoint[]> = {
  r1: [
    { lat: 39.9000, lng: 116.4100, x: -60, z: -120, stationName: '望京站' },
    { lat: 39.9020, lng: 116.4080, x: -40, z: -80 },
    { lat: 39.9030, lng: 116.4075, x: -20, z: -60, stationName: '南湖站' },
    { lat: 39.9040, lng: 116.4074, x: 0, z: -40 },
    { lat: 39.9042, lng: 116.4074, x: 0, z: -20, stationName: '学校站' },
    { lat: 39.9050, lng: 116.4070, x: 10, z: 0 },
    { lat: 39.9060, lng: 116.4060, x: 30, z: 20 },
    { lat: 39.9080, lng: 116.4040, x: 50, z: 40, stationName: '国贸站' },
  ],
  r2: [
    { lat: 39.9250, lng: 116.3750, x: 60, z: -120, stationName: '中关村站' },
    { lat: 39.9200, lng: 116.3780, x: 40, z: -80 },
    { lat: 39.9150, lng: 116.3800, x: 20, z: -50, stationName: '海淀黄庄' },
    { lat: 39.9100, lng: 116.3820, x: 10, z: -30 },
    { lat: 39.9042, lng: 116.4074, x: 0, z: -20, stationName: '学校站' },
    { lat: 39.9000, lng: 116.4000, x: -10, z: 10 },
    { lat: 39.8950, lng: 116.3950, x: -30, z: 40, stationName: '五道口站' },
  ],
  r3: [
    { lat: 39.8850, lng: 116.4250, x: -50, z: 120, stationName: '亦庄站' },
    { lat: 39.8880, lng: 116.4220, x: -30, z: 80 },
    { lat: 39.8900, lng: 116.4200, x: -15, z: 50, stationName: '宋家庄站' },
    { lat: 39.8950, lng: 116.4150, x: -5, z: 20 },
    { lat: 39.9042, lng: 116.4074, x: 0, z: -20, stationName: '学校站' },
    { lat: 39.9080, lng: 116.4000, x: 15, z: -50 },
  ],
  r4: [
    { lat: 39.9350, lng: 116.3950, x: 40, z: -130, stationName: '西二旗站' },
    { lat: 39.9300, lng: 116.3970, x: 30, z: -100 },
    { lat: 39.9250, lng: 116.3980, x: 20, z: -70, stationName: '上地站' },
    { lat: 39.9150, lng: 116.4000, x: 10, z: -40 },
    { lat: 39.9042, lng: 116.4074, x: 0, z: -20, stationName: '学校站' },
    { lat: 39.8950, lng: 116.4120, x: -15, z: 30 },
  ],
  r5: [
    { lat: 39.9140, lng: 116.4200, x: 60, z: -100, stationName: '东直门站' },
    { lat: 39.9120, lng: 116.4150, x: 40, z: -60 },
    { lat: 39.9100, lng: 116.4120, x: 20, z: -40, stationName: '朝阳门站' },
    { lat: 39.9070, lng: 116.4090, x: 10, z: -30 },
    { lat: 39.9042, lng: 116.4074, x: 0, z: -20, stationName: '学校站' },
    { lat: 39.9010, lng: 116.4000, x: -10, z: 10 },
    { lat: 39.8980, lng: 116.3950, x: -30, z: 40 },
    { lat: 39.8950, lng: 116.3900, x: -50, z: 80, stationName: '天宁寺站' },
  ],
};

const ROUTE_NAME_TO_KEY: Record<string, string> = {
  '东线·科技园方向': 'r1',
  '西线·高新区方向': 'r2',
  '南线·滨河路方向': 'r3',
  '北线·大学城方向': 'r4',
  '中线·老城区方向': 'r5',
};

const DELAY_THRESHOLD_MINUTES = 15;

let simulationInterval: NodeJS.Timeout | null = null;
const busProgress = new Map<string, { segmentIndex: number; t: number; direction: 1 | -1; delayMinutes: number }>();

export class BusSimulator {
  private static getRouteKeyForBus(bus: { routeName: string }): string {
    const routeKey = ROUTE_NAME_TO_KEY[bus.routeName];
    if (routeKey && BUS_ROUTES[routeKey]) {
      return routeKey;
    }
    const fallbackKeys = Object.keys(BUS_ROUTES);
    return fallbackKeys[0] || 'r1';
  }

  static startSimulation(): void {
    if (simulationInterval) return;

    const buses = busRepository.findAll();
    
    for (const bus of buses) {
      const routeKey = this.getRouteKeyForBus(bus);
      const route = BUS_ROUTES[routeKey];
      
      const startIdx = Math.floor(Math.random() * Math.max(1, route.length - 1));
      busProgress.set(bus.id, {
        segmentIndex: startIdx,
        t: Math.random(),
        direction: 1,
        delayMinutes: Math.floor(Math.random() * 5),
      });
    }

    simulationInterval = setInterval(() => {
      try {
        this.updateBusPositions();
        this.checkDelays();
      } catch (err) {
        console.error('[BusSimulator] 模拟错误:', err);
      }
    }, 3000);
    simulationInterval.unref();
  }

  static stopSimulation(): void {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  }

  static getBuses(): Bus[] {
    return busRepository.findAll();
  }

  static getBusById(id: string): Bus | undefined {
    return busRepository.findById(id);
  }

  static getAnomalies(status?: BusAnomaly['status']): BusAnomaly[] {
    const anomalies = busAnomalyRepository.findAll();
    if (status) {
      return anomalies.filter((a) => a.status === status);
    }
    return anomalies;
  }

  private static updateBusPositions(): void {
    const buses = busRepository.findAll();
    const now = dayjs();

    for (const bus of buses) {
      if (bus.status === 'MAINTENANCE') continue;

      const routeKey = this.getRouteKeyForBus(bus);
      const route = BUS_ROUTES[routeKey];
      if (!route || route.length < 2) continue;

      const progress = busProgress.get(bus.id) || {
        segmentIndex: 0,
        t: 0,
        direction: 1,
        delayMinutes: 0,
      };

      const step = 0.08;
      progress.t += step;

      while (progress.t >= 1) {
        progress.t -= 1;
        progress.segmentIndex += progress.direction;

        if (progress.segmentIndex >= route.length - 1) {
          progress.segmentIndex = route.length - 1;
          progress.direction = -1;
          progress.t = 0;
        } else if (progress.segmentIndex <= 0) {
          progress.segmentIndex = 0;
          progress.direction = 1;
          progress.t = 0;
        }

        if (Math.random() < 0.05) {
          progress.delayMinutes += Math.random() < 0.5 ? 1 : 2;
        }
      }

      busProgress.set(bus.id, progress);

      const idx = progress.segmentIndex;
      const forwardNextIdx = Math.min(idx + 1, route.length - 1);
      const backwardNextIdx = Math.max(0, idx - 1);
      const p1 = route[idx];
      const p2 = progress.direction === 1 ? route[forwardNextIdx] : route[backwardNextIdx];
      const t = progress.t;

      const newLat = p1.lat + (p2.lat - p1.lat) * t;
      const newLng = p1.lng + (p2.lng - p1.lng) * t;
      const newX = p1.x + (p2.x - p1.x) * t;
      const newZ = p1.z + (p2.z - p1.z) * t;
      const heading = Math.atan2(p2.x - p1.x, p2.z - p1.z) * (180 / Math.PI);

      const atStation = progress.t < 0.15 && p1.stationName;
      const status: Bus['status'] = atStation
        ? (p1.stationName === '学校站' ? 'AT_SCHOOL' : 'AT_STATION')
        : (progress.delayMinutes > DELAY_THRESHOLD_MINUTES ? 'DELAYED' : 'ON_ROUTE');

      const nextStationIdx = progress.direction === 1 ? forwardNextIdx : backwardNextIdx;
      const nextStation = route[nextStationIdx]?.stationName || '途中';

      const segmentsRemaining = progress.direction === 1
        ? (route.length - 1 - idx) - t
        : idx - t;
      const baseArrivalMinutes = Math.max(0, segmentsRemaining) * 6;
      const estArrival = now.add(baseArrivalMinutes + progress.delayMinutes, 'minute');

      const speed = atStation ? 0 : Math.floor(15 + Math.random() * 35);

      busRepository.update(bus.id, {
        currentPosition: {
          lat: newLat,
          lng: newLng,
          timestamp: now.toISOString(),
          speed,
          heading: (heading + 360) % 360,
        },
        position3D: {
          x: newX,
          y: 0,
          z: newZ,
          rotationY: heading * (Math.PI / 180),
        },
        estimatedArrival: estArrival.toISOString(),
        nextStation,
        status,
      });
    }
  }

  static checkDelays(): BusAnomaly[] {
    const buses = busRepository.findAll();
    const now = dayjs();
    const generated: BusAnomaly[] = [];

    for (const bus of buses) {
      if (bus.status === 'MAINTENANCE') continue;

      const progress = busProgress.get(bus.id);
      const delayMinutes = progress?.delayMinutes || 0;

      const estArrival = dayjs(bus.estimatedArrival);
      const arrivalDiffMinutes = estArrival.diff(now, 'minute');

      const isDelayed = delayMinutes >= DELAY_THRESHOLD_MINUTES ||
        (arrivalDiffMinutes < -DELAY_THRESHOLD_MINUTES && bus.status !== 'AT_SCHOOL');

      if (isDelayed) {
        const existingAnomaly = busAnomalyRepository.findOne(
          (a) =>
            a.busId === bus.id &&
            a.type === 'DELAY_OVER_15MIN' &&
            a.status !== 'RESOLVED' &&
            dayjs(a.createdAt).isAfter(now.subtract(2, 'hour')),
        );

        if (!existingAnomaly) {
          const notifiedParents = bus.onboardStudents.slice(0, 8).map((stu) => ({
            studentName: stu.studentName,
            phone: stu.parentPhone,
            notifiedAt: now.toISOString(),
          }));

          const extraParents: { studentName: string; phone: string; notifiedAt: string }[] = [];
          if (bus.onboardStudents.length < 3) {
            for (let i = 0; i < 5; i++) {
              extraParents.push({
                studentName: `随机学生${i + 1}`,
                phone: `13${6 + (i % 3)}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
                notifiedAt: now.toISOString(),
              });
            }
          }

          const anomaly = busAnomalyRepository.create({
            busId: bus.id,
            busNumber: bus.busNumber,
            type: 'DELAY_OVER_15MIN',
            severity: delayMinutes >= 30 ? 'HIGH' : 'MEDIUM',
            description: `校车${bus.busNumber}(${bus.routeName})预计延误${delayMinutes}分钟，预计${estArrival.format('HH:mm')}到达`,
            notifiedParents: [...notifiedParents, ...extraParents],
            notifiedTeachers: [
              {
                teacherName: '班主任老师',
                phone: '13800000001',
                notifiedAt: now.toISOString(),
              },
            ],
            status: 'PENDING',
            createdAt: now.toISOString(),
          });
          generated.push(anomaly);
        }
      }
    }

    return generated;
  }

  static resolveAnomaly(anomalyId: string, resolutionNote: string): BusAnomaly | null {
    const anomaly = busAnomalyRepository.findById(anomalyId);
    if (!anomaly) return null;

    return busAnomalyRepository.update(anomalyId, {
      status: 'RESOLVED',
      resolvedAt: dayjs().toISOString(),
      resolutionNote,
    });
  }
}
