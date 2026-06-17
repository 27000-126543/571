import { Router, type Request, type Response } from 'express';
import { BusSimulator } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import type { ApiResponse, Bus, BusAnomaly } from '../../shared/types.js';

const router = Router();

router.get('/buses', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const buses = BusSimulator.getBuses();
    const response: ApiResponse<Bus[]> = {
      code: 0,
      message: '获取校车列表成功',
      data: buses,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取校车列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/buses/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bus = BusSimulator.getBusById(id);
    if (!bus) {
      const response: ApiResponse<null> = { code: 404, message: '校车不存在', data: null, timestamp: Date.now() };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<Bus> = {
      code: 0,
      message: '获取校车详情成功',
      data: bus,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取校车详情失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/buses/anomalies', authenticate, requireRoles('logistics_director', 'moral_director', 'principal', 'parent'), async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as BusAnomaly['status'] | undefined;
    const anomalies = BusSimulator.getAnomalies(status);
    const response: ApiResponse<BusAnomaly[]> = {
      code: 0,
      message: '获取校车异常列表成功',
      data: anomalies,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取校车异常列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/buses/scan', authenticate, requireRoles('logistics_director', 'principal'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const anomalies = BusSimulator.checkDelays();
    const response: ApiResponse<BusAnomaly[]> = {
      code: 0,
      message: '校车异常扫描完成',
      data: anomalies,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '校车异常扫描失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
