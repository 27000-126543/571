import dayjs from 'dayjs';
import {
  purchaseOrderRepository,
  visitorRepository,
  workOrderRepository,
  userRepository,
} from '../dataSource/index.js';
import type {
  ApprovalStatus,
  PurchaseOrder,
  Visitor,
  WorkOrder,
  UserRole,
  User,
} from '../../shared/types.js';

export type OrderType = 'PURCHASE' | 'VISITOR' | 'WORKORDER';

interface ApprovalItem {
  id: string;
  orderType: OrderType;
  orderNo?: string;
  title: string;
  status: ApprovalStatus;
  currentLevel: 1 | 2 | 3;
  createdBy?: string;
  createdAt: string;
  amount?: number;
  target?: string;
}

interface ApproverInfo {
  approverId: string;
  approverName: string;
}

const ROLE_LEVEL_MAP: Record<UserRole, 1 | 2 | 3 | 'HEAD_TEACHER'> = {
  logistics_director: 1,
  moral_director: 2,
  principal: 3,
  head_teacher: 'HEAD_TEACHER',
  teacher: 'HEAD_TEACHER',
  student: 'HEAD_TEACHER',
  parent: 'HEAD_TEACHER',
};

export class ApprovalEngine {
  static approve(
    orderId: string,
    orderType: OrderType,
    approver: ApproverInfo,
  ): PurchaseOrder | Visitor | WorkOrder {
    const order = this.getOrder(orderId, orderType);
    if (!order) {
      throw new Error(`审批对象不存在: ${orderType} - ${orderId}`);
    }

    this.validateCanApprove(order, orderType, approver);

    const now = dayjs().toISOString();
    const currentLevel = (order as any).currentLevel as 1 | 2 | 3;
    let newStatus: ApprovalStatus;
    let newLevel: 1 | 2 | 3 = currentLevel;

    if (currentLevel < 3) {
      newStatus = `PENDING_L${currentLevel + 1}` as ApprovalStatus;
      newLevel = (currentLevel + 1) as 1 | 2 | 3;
    } else {
      newStatus = 'APPROVED';
    }

    return this.updateApprovalRecord(order, orderType, {
      level: currentLevel,
      approved: true,
      approverId: approver.approverId,
      approverName: approver.approverName,
      comment: '审核通过',
      approvedAt: now,
    }, newStatus, newLevel);
  }

  static reject(
    orderId: string,
    orderType: OrderType,
    approver: ApproverInfo,
    comment: string,
  ): PurchaseOrder | Visitor | WorkOrder {
    const order = this.getOrder(orderId, orderType);
    if (!order) {
      throw new Error(`审批对象不存在: ${orderType} - ${orderId}`);
    }

    this.validateCanApprove(order, orderType, approver);

    const now = dayjs().toISOString();
    const currentLevel = (order as any).currentLevel as 1 | 2 | 3;

    return this.updateApprovalRecord(order, orderType, {
      level: currentLevel,
      approved: false,
      approverId: approver.approverId,
      approverName: approver.approverName,
      comment: comment || '审核未通过',
      approvedAt: now,
    }, 'REJECTED', currentLevel);
  }

  static getTodoList(
    userId: string,
    role: UserRole,
  ): { items: ApprovalItem[]; total: number; byLevel: { level: number; count: number }[] } {
    const level = ROLE_LEVEL_MAP[role];
    const items: ApprovalItem[] = [];

    const user = userRepository.findById(userId);
    const allPurchase = purchaseOrderRepository.findAll();
    const allVisitors = visitorRepository.findAll();
    const allWorkOrders = workOrderRepository.findAll();

    for (const po of allPurchase) {
      if (this.isTodoStatus(po.status)) {
        if (this.canUserApproveLevel(role, po.currentLevel, userId, po)) {
          items.push({
            id: po.id,
            orderType: 'PURCHASE',
            orderNo: po.orderNo,
            title: po.title,
            status: po.status,
            currentLevel: po.currentLevel,
            createdBy: po.createdBy,
            createdAt: po.createdAt,
            amount: po.totalAmount,
          });
        }
      }
    }

    for (const v of allVisitors) {
      if (this.isTodoStatus(v.status)) {
        const vLevel = this.determineVisitorLevel(v);
        if (this.canUserApproveVisitor(role, userId, v, vLevel)) {
          items.push({
            id: v.id,
            orderType: 'VISITOR',
            title: `访客申请 - ${v.visitorName}(${v.relation})`,
            status: v.status,
            currentLevel: vLevel,
            createdAt: v.createdAt,
            target: v.targetName,
          });
        }
      }
    }

    for (const wo of allWorkOrders) {
      if (wo.status === 'NEW') {
        if (level === 1 || role === 'logistics_director' || role === 'principal') {
          items.push({
            id: wo.id,
            orderType: 'WORKORDER',
            orderNo: wo.ticketNo,
            title: `工单 - ${wo.faultTitle}`,
            status: 'PENDING_L1',
            currentLevel: 1,
            createdAt: wo.createdAt,
            target: wo.location,
          });
        }
      }
    }

    const byLevel: { level: number; count: number }[] = [
      { level: 1, count: items.filter((i) => i.currentLevel === 1).length },
      { level: 2, count: items.filter((i) => i.currentLevel === 2).length },
      { level: 3, count: items.filter((i) => i.currentLevel === 3).length },
    ];

    return {
      items: items.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
      total: items.length,
      byLevel,
    };
  }

  static getApprovalHistory(
    orderId: string,
    orderType: OrderType,
  ): { approvals: PurchaseOrder['approvals'] | null; order: any } {
    const order = this.getOrder(orderId, orderType);
    if (!order) {
      throw new Error('审批对象不存在');
    }
    return {
      approvals: (order as any).approvals || null,
      order,
    };
  }

  static executeOrder(orderId: string, orderType: OrderType): PurchaseOrder | Visitor | WorkOrder {
    const order = this.getOrder(orderId, orderType);
    if (!order) throw new Error('订单不存在');
    if ((order as any).status !== 'APPROVED') {
      throw new Error('只有已审批通过的订单可以执行');
    }
    return this.updateOrderStatus(order, orderType, 'EXECUTED', (order as any).currentLevel || 3);
  }

  private static isTodoStatus(status: ApprovalStatus): boolean {
    return status === 'PENDING_L1' || status === 'PENDING_L2' || status === 'PENDING_L3';
  }

  private static determineVisitorLevel(visitor: Visitor): 1 | 2 | 3 {
    if (visitor.status === 'PENDING_L1') return 1;
    if (visitor.status === 'PENDING_L2') return 2;
    if (visitor.status === 'PENDING_L3') return 3;
    if (visitor.headTeacherId && visitor.status !== 'APPROVED' && visitor.status !== 'REJECTED') {
      return 1;
    }
    return 1;
  }

  private static canUserApproveLevel(
    role: UserRole,
    level: 1 | 2 | 3,
    userId: string,
    order: any,
  ): boolean {
    const userLevel = ROLE_LEVEL_MAP[role];
    if (typeof userLevel !== 'number') {
      if (userLevel === 'HEAD_TEACHER' && order.headTeacherId) {
        return order.headTeacherId === userId;
      }
      return false;
    }
    return userLevel === level;
  }

  private static canUserApproveVisitor(
    role: UserRole,
    userId: string,
    visitor: Visitor,
    level: 1 | 2 | 3,
  ): boolean {
    if (visitor.headTeacherId && visitor.status === 'PENDING_L1') {
      return visitor.headTeacherId === userId;
    }
    const userLevel = ROLE_LEVEL_MAP[role];
    if (typeof userLevel === 'number') {
      return userLevel === level;
    }
    return false;
  }

  private static validateCanApprove(
    order: any,
    orderType: OrderType,
    approver: ApproverInfo,
  ): void {
    const status: ApprovalStatus = order.status;
    if (!this.isTodoStatus(status)) {
      if (orderType === 'WORKORDER' && order.status === 'NEW') {
      } else {
        throw new Error('当前状态不可审批');
      }
    }

    const approverUser = userRepository.findById(approver.approverId);
    if (!approverUser) {
      throw new Error('审批人不存在');
    }

    const approverLevel = ROLE_LEVEL_MAP[approverUser.role];
    const currentLevel = (order as any).currentLevel as 1 | 2 | 3;

    if (orderType === 'VISITOR' && order.headTeacherId) {
      if (status === 'PENDING_L1' && order.headTeacherId !== approver.approverId) {
        throw new Error('当前审批需班主任处理');
      }
    }

    if (orderType === 'WORKORDER' && order.status === 'NEW') {
      if (typeof approverLevel === 'number' && approverLevel <= 1) {
        return;
      }
      if (approverUser.role === 'principal') {
        return;
      }
      if (approverUser.role === 'logistics_director') {
        return;
      }
      throw new Error('当前工单审批需后勤主任或校长处理');
    }

    if (typeof approverLevel !== 'number') {
      throw new Error('您没有审批权限');
    }

    if (approverLevel !== currentLevel) {
      const levelLabels: Record<number, string> = { 1: '后勤主任', 2: '德育主任', 3: '校长' };
      throw new Error(
        `当前为 L${currentLevel} (${levelLabels[currentLevel]}) 待审批，您只能审批 L${approverLevel} 级别的申请`,
      );
    }
  }

  private static getOrder(orderId: string, orderType: OrderType): any {
    switch (orderType) {
      case 'PURCHASE':
        return purchaseOrderRepository.findById(orderId);
      case 'VISITOR':
        return visitorRepository.findById(orderId);
      case 'WORKORDER':
        return workOrderRepository.findById(orderId);
    }
  }

  private static updateApprovalRecord(
    order: any,
    orderType: OrderType,
    approval: {
      level: 1 | 2 | 3;
      approved: boolean;
      approverId?: string;
      approverName?: string;
      comment?: string;
      approvedAt?: string;
    },
    newStatus: ApprovalStatus,
    newLevel: 1 | 2 | 3,
  ): any {
    const approvals = (order.approvals as PurchaseOrder['approvals']) || [
      { level: 1, approved: false },
      { level: 2, approved: false },
      { level: 3, approved: false },
    ];

    const idx = approvals.findIndex((a) => a.level === approval.level);
    if (idx >= 0) {
      approvals[idx] = { ...approvals[idx], ...approval };
    }

    switch (orderType) {
      case 'PURCHASE':
        return purchaseOrderRepository.update(order.id, {
          approvals,
          status: newStatus,
          currentLevel: approval.approved ? newLevel : approval.level,
        });
      case 'VISITOR':
        return visitorRepository.update(order.id, {
          status: newStatus,
        });
      case 'WORKORDER':
        const workStatus = newStatus === 'APPROVED'
          ? 'ASSIGNED'
          : newStatus === 'REJECTED'
          ? 'CANCELLED'
          : 'NEW';
        return workOrderRepository.update(order.id, {
          status: workStatus,
          assignedAt: approval.approved ? dayjs().toISOString() : order.assignedAt,
        });
    }
  }

  private static updateOrderStatus(
    order: any,
    orderType: OrderType,
    status: ApprovalStatus,
    level: 1 | 2 | 3,
  ): any {
    switch (orderType) {
      case 'PURCHASE':
        return purchaseOrderRepository.update(order.id, { status, currentLevel: level });
      case 'VISITOR':
        return visitorRepository.update(order.id, { status });
      case 'WORKORDER':
        return workOrderRepository.update(order.id, {
          status: status === 'EXECUTED' ? 'COMPLETED' : order.status,
          completedAt: status === 'EXECUTED' ? dayjs().toISOString() : order.completedAt,
        });
    }
  }
}
