import { Router, type Request, type Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { operationLogRepository } from '../dataSource/index.js';
import type { ApiResponse, OperationLog } from '../../shared/types.js';

const router = Router();

router.get('/logs', authenticate, requireRoles('logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const pageSize = parseInt((req.query.pageSize as string) || '50');
    const module = req.query.module as string | undefined;
    const userId = req.query.userId as string | undefined;
    let logs = operationLogRepository.findAll();
    if (module) {
      logs = logs.filter((l) => l.module === module);
    }
    if (userId) {
      logs = logs.filter((l) => l.userId === userId);
    }
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedLogs = logs.slice(start, end);
    const result = {
      list: pagedLogs,
      total: logs.length,
      page,
      pageSize,
    };
    const response: ApiResponse<typeof result> = {
      code: 0,
      message: '获取操作日志成功',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取操作日志失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
