import { Router, type Request, type Response } from 'express';
import { ReportService } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import type { ApiResponse, DailyReport } from '../../shared/types.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/reports/daily', authenticate, requireRoles('logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const date = (req.query.date as string) || dayjs().format('YYYY-MM-DD');
    const report = ReportService.generateDailyReport(date);
    const response: ApiResponse<DailyReport> = {
      code: 0,
      message: '获取日报成功',
      data: report,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取日报失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/reports/daily/export', authenticate, requireRoles('logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const date = (req.query.date as string) || dayjs().format('YYYY-MM-DD');
    const buffer = ReportService.exportDailyToExcel(date);
    const fileName = `daily-report-${date}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出日报失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
