import { Router, type Request, type Response } from 'express';
import { ReportService, InventoryService } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  userRepository,
  classroomRepository,
  busRepository,
  workOrderRepository,
  busAnomalyRepository,
  purchaseOrderRepository,
  scheduleConflictRepository,
  deviceRepository,
} from '../dataSource/index.js';
import type { ApiResponse, KpiStats, AlertItem } from '../../shared/types.js';
import dayjs from 'dayjs';
import type { UserRole } from '../../shared/types.js';
import { ApprovalEngine } from '../services/index.js';

const router = Router();

router.get('/stats/kpi', authenticate, requireRoles('head_teacher', 'logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const allStudents = userRepository.filter((u) => u.role === 'student');
    const presentRate = 0.92 + Math.random() * 0.07;
    const presentToday = Math.round(allStudents.length * presentRate);

    const classrooms = classroomRepository.findAll();
    const usedClassrooms = classrooms.filter((c) => c.occupiedSeats > 0).length;
    const classroomUsageRate = classrooms.length > 0
      ? Math.round((usedClassrooms / classrooms.length) * 1000) / 10
      : 0;

    const buses = busRepository.findAll();
    const onlineBuses = buses.filter((b) => b.status !== 'MAINTENANCE').length;

    const pendingTickets = workOrderRepository.filter(
      (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
    ).length;

    let pendingApprovalsCount = 0;
    try {
      const role = req.user!.role as UserRole;
      const userId = req.user!.id;
      const approvalResult = ApprovalEngine.getTodoList(userId, role);
      pendingApprovalsCount = approvalResult.total;
    } catch (_e) {
      const purchasePending = purchaseOrderRepository.filter((p) =>
        p.status.startsWith('PENDING_'),
      ).length;
      pendingApprovalsCount = purchasePending;
    }

    const anomalies = busAnomalyRepository.findAll();
    const criticalAlerts = anomalies.filter((a) => a.status !== 'RESOLVED' && (a.severity === 'HIGH' || a.severity === 'CRITICAL')).length;

    const dishesReport = ReportService.generateDailyReport(dayjs().format('YYYY-MM-DD'));

    const kpi: KpiStats = {
      totalStudents: allStudents.length,
      presentToday,
      attendanceRate: Math.round(presentRate * 1000) / 10,
      classroomUsageRate,
      canteenMealsToday: dishesReport.canteen.totalMealsServed,
      onlineBuses,
      pendingTickets,
      pendingApprovals: pendingApprovalsCount,
      criticalAlerts,
    };

    const response: ApiResponse<KpiStats> = {
      code: 0,
      message: '获取KPI指标成功',
      data: kpi,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取KPI指标失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/stats/alerts', authenticate, requireRoles('head_teacher', 'logistics_director', 'moral_director', 'principal'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const alerts: AlertItem[] = [];
    const now = dayjs();

    const faultDevices = deviceRepository.filter((d) => d.status === 'FAULT' || d.status === 'WARNING');
    for (const device of faultDevices) {
      alerts.push({
        id: `device-${device.id}`,
        type: 'DEVICE_FAULT',
        severity: device.status === 'FAULT' ? 'HIGH' : 'MEDIUM',
        title: `设备故障: ${device.name}`,
        description: `${device.location} - ${device.faultDescription || '检测到异常状态'}`,
        time: device.faultTime || now.toISOString(),
        link: `/devices/${device.id}`,
        handled: false,
      });
    }

    const busIssues = busAnomalyRepository.filter((a) => a.status !== 'RESOLVED');
    for (const anomaly of busIssues) {
      alerts.push({
        id: `bus-${anomaly.id}`,
        type: 'BUS_ANOMALY',
        severity: anomaly.severity,
        title: `校车异常: ${anomaly.busNumber}`,
        description: anomaly.description,
        time: anomaly.createdAt,
        link: `/buses/anomalies/${anomaly.id}`,
        handled: anomaly.status === 'HANDLING',
      });
    }

    const stockResult = InventoryService.scanLowStock();
    for (const item of stockResult.criticals) {
      alerts.push({
        id: `stock-critical-${item.id}`,
        type: 'STOCK_LOW',
        severity: 'HIGH',
        title: `库存紧急: ${item.name}`,
        description: `当前库存 ${item.currentStock}${item.unit}，安全阈值 ${item.safetyThreshold}${item.unit}`,
        time: now.toISOString(),
        link: `/canteen/inventory`,
        handled: false,
      });
    }
    for (const item of stockResult.warnings) {
      alerts.push({
        id: `stock-warning-${item.id}`,
        type: 'STOCK_LOW',
        severity: 'MEDIUM',
        title: `库存预警: ${item.name}`,
        description: `当前库存 ${item.currentStock}${item.unit}，安全阈值 ${item.safetyThreshold}${item.unit}`,
        time: now.toISOString(),
        link: `/canteen/inventory`,
        handled: false,
      });
    }

    const pendingPurchase = purchaseOrderRepository.filter((p) => p.status.startsWith('PENDING_'));
    for (const po of pendingPurchase.slice(0, 5)) {
      alerts.push({
        id: `approval-${po.id}`,
        type: 'APPROVAL_TODO',
        severity: 'MEDIUM',
        title: `待审批: ${po.title}`,
        description: `采购单 ${po.orderNo}，金额 ¥${po.totalAmount}`,
        time: po.createdAt,
        link: `/approvals/todo`,
        handled: false,
      });
    }

    const conflicts = scheduleConflictRepository.filter((c) => !c.resolved);
    for (const conflict of conflicts) {
      alerts.push({
        id: `conflict-${conflict.id}`,
        type: 'CONFLICT',
        severity: 'HIGH',
        title: `排课冲突: ${conflict.classroomNumber}`,
        description: `${conflict.timeSlot} 存在 ${conflict.courses.length} 门课程冲突`,
        time: now.toISOString(),
        link: `/schedule/conflicts`,
        handled: false,
      });
    }

    alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const response: ApiResponse<AlertItem[]> = {
      code: 0,
      message: '获取告警列表成功',
      data: alerts,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取告警列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
