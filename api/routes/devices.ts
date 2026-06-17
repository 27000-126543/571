import { Router, type Request, type Response } from 'express';
import { WorkOrderService } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { deviceRepository } from '../dataSource/index.js';
import type { ApiResponse, Device, WorkOrder, TicketStatus } from '../../shared/types.js';

const router = Router();

router.get('/devices', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const devices = deviceRepository.findAll();
    const response: ApiResponse<Device[]> = {
      code: 0,
      message: '获取设备列表成功',
      data: devices,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取设备列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/devices/tickets', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as TicketStatus | undefined;
    const tickets = WorkOrderService.getTicketsByStatus(status);
    const response: ApiResponse<WorkOrder[]> = {
      code: 0,
      message: '获取工单列表成功',
      data: tickets,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取工单列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/devices/report', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, faultTitle, faultDescription, faultPhotos } = req.body as {
      deviceId: string;
      faultTitle: string;
      faultDescription: string;
      faultPhotos?: string[];
    };
    const reporterId = req.user!.id;
    const ticket = WorkOrderService.createTicket(deviceId, reporterId, faultTitle, faultDescription, faultPhotos);
    const response: ApiResponse<WorkOrder> = {
      code: 0,
      message: '故障报修成功',
      data: ticket,
      timestamp: Date.now(),
    };
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '故障报修失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

router.put('/devices/tickets/:id/status', authenticate, requireRoles('logistics_director', 'moral_director', 'principal', 'teacher', 'head_teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, rating, repairCost, assigneeId } = req.body as {
      status: TicketStatus;
      note?: string;
      rating?: 1 | 2 | 3 | 4 | 5;
      repairCost?: number;
      assigneeId?: string;
    };
    let ticket: WorkOrder;
    if (status === 'ASSIGNED' && assigneeId) {
      ticket = WorkOrderService.assign(id, assigneeId);
    } else {
      ticket = WorkOrderService.updateStatus(id, status, note, rating, repairCost);
    }
    const response: ApiResponse<WorkOrder> = {
      code: 0,
      message: '工单状态更新成功',
      data: ticket,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '工单状态更新失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

export default router;
