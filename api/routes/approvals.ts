import { Router, type Request, type Response } from 'express';
import { ApprovalEngine } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import type { ApiResponse, PurchaseOrder, Visitor, WorkOrder, UserRole } from '../../shared/types.js';

const router = Router();

router.get('/approvals/todo', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role as UserRole;
    const result = ApprovalEngine.getTodoList(userId, role);
    const response: ApiResponse<typeof result> = {
      code: 0,
      message: '获取待审批列表成功',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取待审批列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/approvals/:id/approve', authenticate, requireRoles('head_teacher', 'logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderType } = req.body as { orderType: 'PURCHASE' | 'VISITOR' | 'WORKORDER' };
    const approver = {
      approverId: req.user!.id,
      approverName: req.user!.name,
    };
    const result = ApprovalEngine.approve(id, orderType, approver);
    const response: ApiResponse<PurchaseOrder | Visitor | WorkOrder> = {
      code: 0,
      message: '审批通过',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '审批失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

router.post('/approvals/:id/reject', authenticate, requireRoles('head_teacher', 'logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderType, comment } = req.body as { orderType: 'PURCHASE' | 'VISITOR' | 'WORKORDER'; comment: string };
    const approver = {
      approverId: req.user!.id,
      approverName: req.user!.name,
    };
    const result = ApprovalEngine.reject(id, orderType, approver, comment);
    const response: ApiResponse<PurchaseOrder | Visitor | WorkOrder> = {
      code: 0,
      message: '审批拒绝',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '审批拒绝失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

export default router;
