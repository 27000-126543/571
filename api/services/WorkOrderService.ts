import dayjs from 'dayjs';
import {
  workOrderRepository,
  deviceRepository,
  userRepository,
} from '../dataSource/index.js';
import type { WorkOrder, TicketStatus, DeviceType } from '../../shared/types.js';

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PENDING_VERIFY', 'CANCELLED'],
  PENDING_VERIFY: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

function generateTicketNo(): string {
  return `WO${dayjs().format('YYYYMMDDHHmmss')}`;
}

function inferPriority(faultDescription: string): WorkOrder['priority'] {
  const desc = faultDescription.toLowerCase();
  if (desc.includes('火灾') || desc.includes('漏电') || desc.includes('消防') || desc.includes('紧急')) {
    return 'CRITICAL';
  }
  if (desc.includes('无法使用') || desc.includes('坏') || desc.includes('停机')) {
    return 'HIGH';
  }
  if (desc.includes('噪音') || desc.includes('异常') || desc.includes('警告')) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export class WorkOrderService {
  static createTicket(
    deviceId: string,
    reporterId: string,
    faultTitle: string,
    faultDescription: string,
    faultPhotos?: string[],
  ): WorkOrder {
    const device = deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }

    const reporter = userRepository.findById(reporterId);
    if (!reporter) {
      throw new Error('报修人不存在');
    }

    const ticket = workOrderRepository.create({
      ticketNo: generateTicketNo(),
      deviceId,
      deviceName: device.name,
      deviceType: device.type,
      location: device.location,
      reporterId,
      reporterName: reporter.name,
      reporterPhone: reporter.phone,
      faultTitle,
      faultDescription,
      faultPhotos,
      priority: inferPriority(faultDescription + faultTitle),
      status: 'NEW',
      createdAt: dayjs().toISOString(),
    });

    deviceRepository.update(deviceId, {
      status: 'FAULT',
      faultDescription,
      faultTime: dayjs().toISOString(),
    });

    return ticket;
  }

  static assign(
    ticketId: string,
    assigneeId: string,
  ): WorkOrder {
    const ticket = workOrderRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('工单不存在');
    }

    if (!canTransition(ticket.status, 'ASSIGNED')) {
      throw new Error(`当前状态[${ticket.status}]无法分配`);
    }

    const assignee = userRepository.findById(assigneeId);
    if (!assignee) {
      throw new Error('处理人不存在');
    }

    const validRoles = ['logistics_director', 'teacher', 'principal', 'moral_director'];
    if (!validRoles.includes(assignee.role)) {
      throw new Error('该用户没有维修权限');
    }

    return workOrderRepository.update(ticketId, {
      status: 'ASSIGNED',
      assigneeId,
      assigneeName: assignee.name,
      assignedAt: dayjs().toISOString(),
    })!;
  }

  static updateStatus(
    ticketId: string,
    newStatus: TicketStatus,
    note?: string,
    rating?: 1 | 2 | 3 | 4 | 5,
    repairCost?: number,
  ): WorkOrder {
    const ticket = workOrderRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('工单不存在');
    }

    if (!canTransition(ticket.status, newStatus)) {
      throw new Error(`状态流转不合法: ${ticket.status} -> ${newStatus}`);
    }

    const updates: Partial<WorkOrder> = {
      status: newStatus,
    };
    const now = dayjs();

    switch (newStatus) {
      case 'IN_PROGRESS':
        updates.startedAt = now.toISOString();
        if (note) updates.repairNote = note;
        break;
      case 'PENDING_VERIFY':
        if (note) updates.repairNote = note;
        if (repairCost !== undefined) updates.repairCost = repairCost;
        break;
      case 'COMPLETED':
        updates.completedAt = now.toISOString();
        if (note) updates.repairNote = (ticket.repairNote ? ticket.repairNote + '\n' : '') + note;
        if (rating) updates.rating = rating;
        if (repairCost !== undefined) updates.repairCost = repairCost;
        if (ticket.deviceId) {
          deviceRepository.update(ticket.deviceId, {
            status: 'NORMAL',
            lastMaintenanceDate: now.toISOString(),
          });
        }
        break;
      case 'CANCELLED':
        if (note) updates.repairNote = `[取消原因] ${note}`;
        break;
    }

    return workOrderRepository.update(ticketId, updates)!;
  }

  static getTicketsByStatus(status?: TicketStatus): WorkOrder[] {
    const tickets = workOrderRepository.findAll();
    if (status) {
      return tickets.filter((t) => t.status === status);
    }
    return tickets.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }

  static getTicketsByDevice(deviceId: string): WorkOrder[] {
    return workOrderRepository
      .filter((t) => t.deviceId === deviceId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }

  static getTicketsByAssignee(assigneeId: string): WorkOrder[] {
    return workOrderRepository
      .filter((t) => t.assigneeId === assigneeId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }

  static getTicketsByReporter(reporterId: string): WorkOrder[] {
    return workOrderRepository
      .filter((t) => t.reporterId === reporterId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }

  static getTicketStats(): {
    total: number;
    byStatus: { status: TicketStatus; count: number }[];
    byPriority: { priority: WorkOrder['priority']; count: number }[];
    byType: { type: DeviceType; count: number; completed: number }[];
    avgRepairHours: number;
    openSinceOver24h: number;
  } {
    const tickets = workOrderRepository.findAll();
    const now = dayjs();

    const statusCounts = new Map<TicketStatus, number>();
    const priorityCounts = new Map<WorkOrder['priority'], number>();
    const typeMap = new Map<DeviceType, { count: number; completed: number }>();
    let totalRepairHours = 0;
    let completedCount = 0;
    let openOver24h = 0;

    for (const t of tickets) {
      statusCounts.set(t.status, (statusCounts.get(t.status) || 0) + 1);
      priorityCounts.set(t.priority, (priorityCounts.get(t.priority) || 0) + 1);

      if (!typeMap.has(t.deviceType)) {
        typeMap.set(t.deviceType, { count: 0, completed: 0 });
      }
      const tm = typeMap.get(t.deviceType)!;
      tm.count++;
      if (t.status === 'COMPLETED') {
        tm.completed++;
        if (t.completedAt && t.startedAt) {
          totalRepairHours += dayjs(t.completedAt).diff(dayjs(t.startedAt), 'hour', true);
          completedCount++;
        }
      }

      if (t.status !== 'COMPLETED' && t.status !== 'CANCELLED') {
        if (now.diff(dayjs(t.createdAt), 'hour') > 24) {
          openOver24h++;
        }
      }
    }

    return {
      total: tickets.length,
      byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      byPriority: Array.from(priorityCounts.entries()).map(([priority, count]) => ({ priority, count })),
      byType: Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data })),
      avgRepairHours: completedCount > 0 ? Math.round((totalRepairHours / completedCount) * 10) / 10 : 0,
      openSinceOver24h: openOver24h,
    };
  }

  static getTicketById(ticketId: string): WorkOrder | undefined {
    return workOrderRepository.findById(ticketId);
  }

  static rateTicket(ticketId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string): WorkOrder {
    const ticket = workOrderRepository.findById(ticketId);
    if (!ticket) {
      throw new Error('工单不存在');
    }
    if (ticket.status !== 'COMPLETED') {
      throw new Error('只能评价已完成的工单');
    }
    const updates: Partial<WorkOrder> = { rating };
    if (comment) {
      updates.repairNote = (ticket.repairNote ? ticket.repairNote + '\n' : '') + `[评价] ${comment}`;
    }
    return workOrderRepository.update(ticketId, updates)!;
  }
}
