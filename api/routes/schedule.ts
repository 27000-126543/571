import { Router, type Request, type Response } from 'express';
import { AllocationService } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  classroomRepository,
  courseRepository,
  scheduleConflictRepository,
} from '../dataSource/index.js';
import type { ApiResponse, Classroom, AllocationResult, ScheduleConflict } from '../../shared/types.js';

const router = Router();

router.get('/classrooms', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const classrooms = classroomRepository.findAll();
    const response: ApiResponse<Classroom[]> = {
      code: 0,
      message: '获取教室列表成功',
      data: classrooms,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取教室列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/classrooms/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const classroom = classroomRepository.findById(id);
    if (!classroom) {
      const response: ApiResponse<null> = { code: 404, message: '教室不存在', data: null, timestamp: Date.now() };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<Classroom> = {
      code: 0,
      message: '获取教室详情成功',
      data: classroom,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取教室详情失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/schedule/allocate', authenticate, requireRoles('head_teacher', 'logistics_director', 'principal'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = AllocationService.allocateClassrooms();
    const response: ApiResponse<AllocationResult> = {
      code: 0,
      message: '课程分配完成',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '课程分配失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/schedule/timetable', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = AllocationService.getTimetable();
    const response: ApiResponse<AllocationResult> = {
      code: 0,
      message: '获取课表成功',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取课表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/schedule/resolve-conflict', authenticate, requireRoles('head_teacher', 'logistics_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { conflictId, keepCourseId } = req.body as { conflictId: string; keepCourseId: string };
    const result = AllocationService.resolveConflict(conflictId, keepCourseId);
    if (!result) {
      const response: ApiResponse<null> = { code: 404, message: '冲突不存在或处理失败', data: null, timestamp: Date.now() };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<ScheduleConflict> = {
      code: 0,
      message: '冲突已解决',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '解决冲突失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
