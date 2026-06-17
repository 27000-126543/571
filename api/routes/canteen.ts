import { Router, type Request, type Response } from 'express';
import { InventoryService } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  dishRepository,
  inventoryRepository,
  purchaseOrderRepository,
} from '../dataSource/index.js';
import type { ApiResponse, Dish, InventoryItem, PurchaseOrder } from '../../shared/types.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/canteen/dishes', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const dishes = dishRepository.findAll();
    const response: ApiResponse<Dish[]> = {
      code: 0,
      message: '获取菜品列表成功',
      data: dishes,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取菜品列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/canteen/inventory', authenticate, requireRoles('logistics_director', 'principal'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const inventory = InventoryService.getInventory();
    const response: ApiResponse<InventoryItem[]> = {
      code: 0,
      message: '获取库存列表成功',
      data: inventory,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取库存列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.get('/canteen/purchase-orders', authenticate, requireRoles('logistics_director', 'moral_director', 'principal'), async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as PurchaseOrder['status'] | undefined;
    const orders = InventoryService.getPurchaseOrders(status);
    const response: ApiResponse<PurchaseOrder[]> = {
      code: 0,
      message: '获取采购单列表成功',
      data: orders,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取采购单列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/canteen/purchase-orders', authenticate, requireRoles('logistics_director'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, title } = req.body as { items: PurchaseOrder['items']; title: string };
    const createdBy = req.user!.id;
    const totalAmount = items.reduce((sum, it) => sum + it.estimatedPrice, 0);
    const orderNo = `PO${dayjs().format('YYYYMMDDHHmmss')}`;
    const order = purchaseOrderRepository.create({
      orderNo,
      title: title || `采购申请 - ${dayjs().format('MM-DD')}`,
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'DRAFT',
      currentLevel: 1,
      createdBy,
      createdAt: dayjs().toISOString(),
      approvals: [
        { level: 1, approved: false },
        { level: 2, approved: false },
        { level: 3, approved: false },
      ],
    });
    const response: ApiResponse<PurchaseOrder> = {
      code: 0,
      message: '采购单创建成功',
      data: order,
      timestamp: Date.now(),
    };
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '采购单创建失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

export default router;
