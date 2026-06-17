import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import {
  userRepository,
  courseRepository,
  dishRepository,
  inventoryRepository,
  deviceRepository,
  workOrderRepository,
  busAnomalyRepository,
  visitorRepository,
  reservationRepository,
} from '../dataSource/index.js';
import type { DailyReport, DeviceType } from '../../shared/types.js';

const SCHOOL_NAME = '智慧校园示范校';
const GRADE_NAMES: Record<number, string> = {
  7: '初一', 8: '初二', 9: '初三', 10: '高一', 11: '高二', 12: '高三',
};

export class ReportService {
  static generateDailyReport(dateStr: string): DailyReport {
    const date = dayjs(dateStr);
    const startOfDay = date.startOf('day');
    const endOfDay = date.endOf('day');

    const allStudents = userRepository.filter((u) => u.role === 'student');

    const classStats = new Map<string, { total: number; grade: number }>();
    for (const stu of allStudents) {
      const key = stu.classId || `unknown_${stu.grade}`;
      if (!classStats.has(key)) {
        classStats.set(key, { total: 0, grade: stu.grade || 7 });
      }
      classStats.get(key)!.total++;
    }

    const presentRateByGrade = new Map<number, number>();
    for (let g = 7; g <= 12; g++) {
      presentRateByGrade.set(g, 0.88 + Math.random() * 0.11);
    }

    const byGrade: DailyReport['attendance']['byGrade'] = [];
    let totalStudents = 0;
    let totalPresent = 0;

    for (const [classId, info] of classStats.entries()) {
      const rate = presentRateByGrade.get(info.grade) || 0.92;
      const present = Math.round(info.total * rate);
      totalStudents += info.total;
      totalPresent += present;

      const classMatch = classId.match(/cls_(\d+)_(\d+)/);
      const className = classMatch
        ? `${GRADE_NAMES[parseInt(classMatch[1])]}${classMatch[2]}班`
        : classId;

      byGrade.push({
        grade: info.grade,
        className,
        total: info.total,
        present,
        rate: Math.round((present / info.total) * 1000) / 10,
      });
    }

    byGrade.sort((a, b) => a.grade - b.grade || a.className.localeCompare(b.className));

    const attendanceRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 1000) / 10 : 0;

    const dishes = dishRepository.findAll();
    let totalRevenue = 0;
    let totalMeals = 0;
    const dishRank = dishes
      .map((d) => {
        totalRevenue += d.soldToday * d.price;
        totalMeals += d.soldToday;
        return {
          dishName: d.name,
          sold: d.soldToday,
          revenue: Math.round(d.soldToday * d.price * 100) / 100,
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const inventory = inventoryRepository.findAll();
    const consumption = inventory
      .slice(0, 10)
      .map((item) => ({
        ingredientName: item.name,
        used: Math.round(item.dailyConsumption * (0.8 + Math.random() * 0.4) * 10) / 10,
        unit: item.unit,
      }));

    const lowStockAlerts = inventory
      .filter((i) => i.status !== 'NORMAL')
      .map((i) => ({
        itemName: i.name,
        current: i.currentStock,
        threshold: i.safetyThreshold,
      }));

    const devices = deviceRepository.findAll();
    const totalDevices = devices.length;
    const faultDevices = devices.filter((d) => d.status === 'FAULT' || d.status === 'WARNING');
    const tickets = workOrderRepository.findAll();

    const startTs = startOfDay.valueOf();
    const endTs = endOfDay.valueOf();
    const isInDay = (iso: string) => {
      const ts = dayjs(iso).valueOf();
      return ts >= startTs && ts <= endTs;
    };
    const ticketsCreated = tickets.filter((t) => isInDay(t.createdAt));
    const ticketsCompleted = tickets.filter((t) =>
      t.completedAt && isInDay(t.completedAt),
    );

    let totalRepairHours = 0;
    let repairedCount = 0;
    for (const t of ticketsCompleted) {
      if (t.startedAt && t.completedAt) {
        totalRepairHours += dayjs(t.completedAt).diff(dayjs(t.startedAt), 'hour', true);
        repairedCount++;
      }
    }

    const byTypeMap = new Map<DeviceType, { total: number; fault: number }>();
    for (const d of devices) {
      if (!byTypeMap.has(d.type)) {
        byTypeMap.set(d.type, { total: 0, fault: 0 });
      }
      const tm = byTypeMap.get(d.type)!;
      tm.total++;
      if (d.status === 'FAULT' || d.status === 'WARNING') {
        tm.fault++;
      }
    }
    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({ type, ...data }));

    const anomalies = busAnomalyRepository.findAll();
    const todayAnomalies = anomalies.filter((a) => isInDay(a.createdAt));

    const visitors = visitorRepository.findAll();
    const todayVisitors = visitors.filter((v) =>
      dayjs(v.visitDate).isSame(date, 'day'),
    );

    const emergencyDetails: DailyReport['events']['emergencyDetails'] = [];
    for (const a of todayAnomalies) {
      emergencyDetails.push({
        type: `校车异常-${a.type}`,
        time: dayjs(a.createdAt).format('HH:mm:ss'),
        description: a.description,
        status: a.status,
      });
    }
    for (let i = 0; i < Math.floor(Math.random() * 2); i++) {
      emergencyDetails.push({
        type: '设备故障',
        time: date.hour(8 + i * 3).minute(Math.floor(Math.random() * 60)).format('HH:mm:ss'),
        location: '',
        description: `设备告警${i + 1}`,
        status: ['PENDING', 'HANDLING', 'RESOLVED'][i % 3],
      } as any);
    }

    return {
      reportDate: date.format('YYYY-MM-DD'),
      generatedAt: dayjs().toISOString(),
      schoolName: SCHOOL_NAME,
      attendance: {
        totalStudents,
        presentStudents: totalPresent,
        absentStudents: totalStudents - totalPresent,
        attendanceRate,
        byGrade,
      },
      canteen: {
        totalMealsServed: totalMeals,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        topDishes: dishRank,
        consumption,
        lowStockAlerts,
      },
      devices: {
        totalDevices,
        normalCount: totalDevices - faultDevices.length,
        faultCount: faultDevices.length,
        newTickets: ticketsCreated.length,
        completedTickets: ticketsCompleted.length,
        avgRepairHours: repairedCount > 0 ? Math.round((totalRepairHours / repairedCount) * 10) / 10 : 0,
        byType,
      },
      events: {
        busAnomalies: todayAnomalies.length,
        visitorCount: todayVisitors.length,
        emergencyCount: emergencyDetails.length,
        emergencyDetails,
      },
    };
  }

  static exportDailyToExcel(dateStr: string): Buffer {
    const report = this.generateDailyReport(dateStr);

    const wb = XLSX.utils.book_new();

    const attendanceData: any[][] = [
      [`${report.schoolName} - 运营日报 (${report.reportDate})`],
      [],
      ['【一、出勤统计】'],
      [],
      ['总学生数', report.attendance.totalStudents],
      ['出勤人数', report.attendance.presentStudents],
      ['缺勤人数', report.attendance.absentStudents],
      ['出勤率(%)', report.attendance.attendanceRate],
      [],
      ['班级明细'],
      ['年级', '班级', '总人数', '出勤人数', '出勤率(%)'],
      ...report.attendance.byGrade.map((g) => [
        GRADE_NAMES[g.grade] || g.grade,
        g.className,
        g.total,
        g.present,
        g.rate,
      ]),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(attendanceData);
    ws1['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, '出勤统计');

    const canteenData: any[][] = [
      ['【二、食堂统计】'],
      [],
      ['供餐份数', report.canteen.totalMealsServed],
      ['总收入(元)', report.canteen.totalRevenue],
      [],
      ['热销菜品TOP5'],
      ['排名', '菜品名称', '销量', '营收(元)'],
      ...report.canteen.topDishes.map((d, i) => [i + 1, d.dishName, d.sold, d.revenue]),
      [],
      ['食材消耗'],
      ['食材名称', '消耗量', '单位'],
      ...report.canteen.consumption.map((c) => [c.ingredientName, c.used, c.unit]),
      [],
      ['低库存预警'],
      ['食材名称', '当前库存', '安全阈值'],
      ...report.canteen.lowStockAlerts.map((a) => [a.itemName, a.current, a.threshold]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(canteenData);
    ws2['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, '食堂统计');

    const devicesData: any[][] = [
      ['【三、设备统计】'],
      [],
      ['设备总数', report.devices.totalDevices],
      ['正常数', report.devices.normalCount],
      ['故障数', report.devices.faultCount],
      ['新增工单', report.devices.newTickets],
      ['完成工单', report.devices.completedTickets],
      ['平均维修时长(小时)', report.devices.avgRepairHours],
      [],
      ['设备类型分布'],
      ['设备类型', '总数', '故障数'],
      ...report.devices.byType.map((t) => [t.type, t.total, t.fault]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(devicesData);
    ws3['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, '设备统计');

    const eventsData: any[][] = [
      ['【四、事件统计】'],
      [],
      ['校车异常数', report.events.busAnomalies],
      ['访客数', report.events.visitorCount],
      ['紧急事件数', report.events.emergencyCount],
      [],
      ['事件详情'],
      ['事件类型', '发生时间', '描述', '状态'],
      ...report.events.emergencyDetails.map((e) => [e.type, e.time, e.description, e.status]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(eventsData);
    ws4['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 40 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws4, '事件统计');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buffer);
  }

  static getWeeklyReport(startDate: string): Record<string, DailyReport> {
    const result: Record<string, DailyReport> = {};
    for (let i = 0; i < 7; i++) {
      const date = dayjs(startDate).add(i, 'day');
      result[date.format('YYYY-MM-DD')] = this.generateDailyReport(date.format('YYYY-MM-DD'));
    }
    return result;
  }

  static getReportSummary(dateStr: string): {
    kpis: {
      attendanceRate: number;
      mealsPerStudent: number;
      deviceFaultRate: number;
      ticketsTurnaround: number;
    };
    alerts: {
      type: string;
      level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
    }[];
  } {
    const report = this.generateDailyReport(dateStr);
    const mealsPerStudent = report.attendance.presentStudents > 0
      ? Math.round((report.canteen.totalMealsServed / report.attendance.presentStudents) * 10) / 10
      : 0;
    const deviceFaultRate = report.devices.totalDevices > 0
      ? Math.round((report.devices.faultCount / report.devices.totalDevices) * 1000) / 10
      : 0;

    const alerts: { type: string; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; message: string }[] = [];

    if (report.attendance.attendanceRate < 85) {
      alerts.push({
        type: 'ATTENDANCE',
        level: report.attendance.attendanceRate < 75 ? 'HIGH' : 'MEDIUM',
        message: `出勤率仅${report.attendance.attendanceRate}%，低于正常水平`,
      });
    }

    if (report.devices.faultCount > 10) {
      alerts.push({
        type: 'DEVICE',
        level: report.devices.faultCount > 20 ? 'CRITICAL' : 'HIGH',
        message: `当前${report.devices.faultCount}台设备故障/告警`,
      });
    }

    if (report.canteen.lowStockAlerts.length > 5) {
      alerts.push({
        type: 'STOCK',
        level: 'MEDIUM',
        message: `${report.canteen.lowStockAlerts.length}种食材库存低于阈值`,
      });
    }

    if (report.events.busAnomalies > 0) {
      alerts.push({
        type: 'BUS',
        level: 'HIGH',
        message: `今日${report.events.busAnomalies}起校车异常`,
      });
    }

    return {
      kpis: {
        attendanceRate: report.attendance.attendanceRate,
        mealsPerStudent,
        deviceFaultRate,
        ticketsTurnaround: report.devices.avgRepairHours,
      },
      alerts,
    };
  }
}
