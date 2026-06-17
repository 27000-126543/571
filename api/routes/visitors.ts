import { Router, type Request, type Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { visitorRepository, userRepository } from '../dataSource/index.js';
import type { ApiResponse, Visitor } from '../../shared/types.js';
import dayjs from 'dayjs';
import crypto from 'crypto';

const router = Router();

router.get('/visitors', authenticate, requireRoles('head_teacher', 'moral_director', 'logistics_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string | undefined;
    let visitors = visitorRepository.findAll();
    if (date) {
      visitors = visitors.filter((v) => dayjs(v.visitDate).isSame(date, 'day'));
    }
    const response: ApiResponse<Visitor[]> = {
      code: 0,
      message: '获取访客列表成功',
      data: visitors,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取访客列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/visitors', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Omit<Visitor, 'id' | 'status' | 'qrCodeToken' | 'createdAt'>;
    const userId = req.user!.id;
    const headTeacher = userRepository.findOne((u) => u.classId === body.targetId || u.id === userId);
    const qrCodeToken = crypto.randomBytes(20).toString('hex');
    const visitor = visitorRepository.create({
      ...body,
      status: headTeacher ? 'PENDING_L1' : 'PENDING_L2',
      headTeacherId: headTeacher?.id,
      qrCodeToken,
      createdAt: dayjs().toISOString(),
    });
    const response: ApiResponse<Visitor> = {
      code: 0,
      message: '访客申请提交成功',
      data: visitor,
      timestamp: Date.now(),
    };
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '访客申请提交失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

router.get('/visitors/qrcode/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const visitor = visitorRepository.findById(id);
    if (!visitor) {
      const response: ApiResponse<null> = { code: 404, message: '访客记录不存在', data: null, timestamp: Date.now() };
      res.status(404).json(response);
      return;
    }
    const qrData = {
      token: visitor.qrCodeToken,
      visitorId: visitor.id,
      visitorName: visitor.visitorName,
      visitDate: visitor.visitDate,
    };
    const response: ApiResponse<typeof qrData> = {
      code: 0,
      message: '获取二维码成功',
      data: qrData,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取二维码失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/visitors/checkin/:id', authenticate, requireRoles('logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const visitor = visitorRepository.findById(id);
    if (!visitor) {
      const response: ApiResponse<null> = { code: 404, message: '访客记录不存在', data: null, timestamp: Date.now() };
      res.status(404).json(response);
      return;
    }
    if (visitor.status !== 'APPROVED') {
      const response: ApiResponse<null> = { code: 400, message: '访客未通过审批，无法签到', data: null, timestamp: Date.now() };
      res.status(400).json(response);
      return;
    }
    const updated = visitorRepository.update(id, {
      checkInTime: dayjs().toISOString(),
    });
    const response: ApiResponse<Visitor> = {
      code: 0,
      message: '访客签到成功',
      data: updated!,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '访客签到失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

export default router;
