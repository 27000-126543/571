import { Router, type Request, type Response } from 'express';
import { PathService } from '../services/index.js';
import { authenticate } from '../middleware/auth.js';
import type { ApiResponse, NavPath } from '../../shared/types.js';

const router = Router();

router.get('/path/navigate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const from = (req.query.from as string) || '';
    const to = (req.query.to as string) || '';
    const result = PathService.navigate(from, to);
    const response: ApiResponse<NavPath> = {
      code: 0,
      message: '路径规划成功',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '路径规划失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
