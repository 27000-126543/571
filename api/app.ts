import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { initDataSource } from './dataSource/index.js';
import { BusSimulator, SeatService, InventoryService } from './services/index.js';

import authRoutes from './routes/auth.js';
import scheduleRoutes from './routes/schedule.js';
import pathRoutes from './routes/path.js';
import libraryRoutes from './routes/library.js';
import canteenRoutes from './routes/canteen.js';
import busesRoutes from './routes/buses.js';
import visitorsRoutes from './routes/visitors.js';
import devicesRoutes from './routes/devices.js';
import approvalsRoutes from './routes/approvals.js';
import reportsRoutes from './routes/reports.js';
import logsRoutes from './routes/logs.js';
import statsRoutes from './routes/stats.js';
import { operationLogger } from './middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

initDataSource();

console.log('[App] 数据源初始化完成');

BusSimulator.startSimulation();
console.log('[App] 校车模拟器已启动');

SeatService.startAutoCheck();
console.log('[App] 座位超时检测已启动');

let inventoryScanCount = 0;
setInterval(() => {
  try {
    InventoryService.scanLowStock();
    inventoryScanCount++;
    if (inventoryScanCount % 20 === 0) {
      console.log(`[App] 库存扫描已执行 ${inventoryScanCount} 次`);
    }
  } catch (err) {
    console.error('[App] 库存扫描失败:', err);
  }
}, 60 * 1000);
console.log('[App] 库存定时扫描已启动');

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(operationLogger);

app.use('/api/auth', authRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', pathRoutes);
app.use('/api', libraryRoutes);
app.use('/api', canteenRoutes);
app.use('/api', busesRoutes);
app.use('/api', visitorsRoutes);
app.use('/api', devicesRoutes);
app.use('/api', approvalsRoutes);
app.use('/api', reportsRoutes);
app.use('/api', logsRoutes);
app.use('/api', statsRoutes);

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      code: 0,
      message: 'ok',
      data: {
        status: 'running',
        timestamp: Date.now(),
        busSimulation: 'active',
        seatChecker: 'active',
        inventoryScanner: 'active',
      },
      timestamp: Date.now(),
    });
  },
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[App] 未处理的错误:', error);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
    timestamp: Date.now(),
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API 路由不存在',
    data: null,
    timestamp: Date.now(),
  });
});

export default app;
