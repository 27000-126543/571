import dayjs from 'dayjs';
import {
  inventoryRepository,
  purchaseOrderRepository,
  userRepository,
} from '../dataSource/index.js';
import type { InventoryItem, PurchaseOrder } from '../../shared/types.js';

const PURCHASE_DAYS_COVERAGE = 7;

function computeStatus(item: InventoryItem): InventoryItem['status'] {
  const daysRemaining = item.dailyConsumption > 0 ? item.currentStock / item.dailyConsumption : Infinity;
  if (item.currentStock < item.safetyThreshold * 0.5 || daysRemaining < 2) {
    return 'CRITICAL';
  }
  if (item.currentStock < item.safetyThreshold || daysRemaining < 4) {
    return 'WARNING';
  }
  return 'NORMAL';
}

export class InventoryService {
  static getInventory(): InventoryItem[] {
    const items = inventoryRepository.findAll();
    return items.map((item) => {
      const updated = { ...item, status: computeStatus(item) };
      if (updated.status !== item.status) {
        inventoryRepository.update(item.id, { status: updated.status });
      }
      return updated;
    });
  }

  static getItemById(id: string): InventoryItem | undefined {
    const item = inventoryRepository.findById(id);
    if (!item) return undefined;
    return { ...item, status: computeStatus(item) };
  }

  static updateStock(itemId: string, quantity: number, operation: 'ADD' | 'SUBTRACT' | 'SET'): InventoryItem {
    const item = inventoryRepository.findById(itemId);
    if (!item) {
      throw new Error('库存项不存在');
    }

    let newStock: number;
    switch (operation) {
      case 'ADD':
        newStock = item.currentStock + quantity;
        break;
      case 'SUBTRACT':
        newStock = item.currentStock - quantity;
        if (newStock < 0) {
          throw new Error('库存不足');
        }
        break;
      case 'SET':
        if (quantity < 0) {
          throw new Error('库存量不能为负');
        }
        newStock = quantity;
        break;
    }

    const isRestocking = operation === 'ADD' || (operation === 'SET' && quantity > item.currentStock);
    const status = computeStatus({ ...item, currentStock: newStock });

    const updated = inventoryRepository.update(itemId, {
      currentStock: newStock,
      status,
      lastPurchasedAt: isRestocking ? dayjs().toISOString() : item.lastPurchasedAt,
    });

    return updated!;
  }

  static scanLowStock(): {
    warnings: InventoryItem[];
    criticals: InventoryItem[];
    purchaseOrder?: PurchaseOrder;
  } {
    const items = this.getInventory();
    const warnings: InventoryItem[] = [];
    const criticals: InventoryItem[] = [];

    for (const item of items) {
      if (item.status === 'WARNING') warnings.push(item);
      if (item.status === 'CRITICAL') criticals.push(item);
    }

    let purchaseOrder: PurchaseOrder | undefined;
    const lowStockItems = [...criticals, ...warnings];
    if (lowStockItems.length > 0) {
      purchaseOrder = this.createAutoSubmitPurchaseOrder(lowStockItems);
    }

    return { warnings, criticals, purchaseOrder };
  }

  private static createDraftPurchaseOrder(lowStockItems: InventoryItem[]): PurchaseOrder {
    const existingDrafts = purchaseOrderRepository.filter(
      (p) => p.status === 'DRAFT',
    );

    const newItems = lowStockItems.map((item) => {
      const recommendedQty = Math.max(
        item.safetyThreshold * 2 - item.currentStock,
        item.dailyConsumption * PURCHASE_DAYS_COVERAGE,
      );
      const roundedQty = Math.ceil(recommendedQty / 5) * 5;
      const estimatedPrice = this.estimateUnitPrice(item) * roundedQty;
      return {
        itemId: item.id,
        itemName: item.name,
        quantity: roundedQty,
        unit: item.unit,
        estimatedPrice: Math.round(estimatedPrice * 100) / 100,
      };
    });

    if (existingDrafts.length > 0) {
      const draft = existingDrafts[0];
      const mergedItems = [...draft.items];
      for (const ni of newItems) {
        const idx = mergedItems.findIndex((m) => m.itemId === ni.itemId);
        if (idx >= 0) {
          const qty = Math.max(mergedItems[idx].quantity, ni.quantity);
          mergedItems[idx] = {
            ...mergedItems[idx],
            quantity: qty,
            estimatedPrice: Math.round(this.estimateUnitPrice(lowStockItems.find(i => i.id === ni.itemId)!) * qty * 100) / 100,
          };
        } else {
          mergedItems.push(ni);
        }
      }
      const totalAmount = mergedItems.reduce((sum, it) => sum + it.estimatedPrice, 0);
      const updated = purchaseOrderRepository.update(draft.id, {
        items: mergedItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
      return updated!;
    }

    const totalAmount = newItems.reduce((sum, it) => sum + it.estimatedPrice, 0);
    const orderNo = `PO${dayjs().format('YYYYMMDDHHmmss')}`;
    const titles = [...new Set(lowStockItems.map((i) => i.category))];

    return purchaseOrderRepository.create({
      orderNo,
      title: `${titles.join('/')}采购申请 - ${dayjs().format('MM-DD')}`,
      items: newItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'DRAFT',
      currentLevel: 1,
      createdBy: 'SYSTEM',
      createdAt: dayjs().toISOString(),
      approvals: [
        { level: 1, approved: false },
        { level: 2, approved: false },
        { level: 3, approved: false },
      ],
    });
  }

  private static createAutoSubmitPurchaseOrder(lowStockItems: InventoryItem[]): PurchaseOrder {
    const pendingOrders = purchaseOrderRepository.filter(
      (p) => p.status === 'PENDING_L1' || p.status === 'PENDING_L2' || p.status === 'PENDING_L3',
    );

    const newItems = lowStockItems.map((item) => {
      const recommendedQty = Math.max(
        item.safetyThreshold * 2 - item.currentStock,
        item.dailyConsumption * PURCHASE_DAYS_COVERAGE,
      );
      const roundedQty = Math.ceil(recommendedQty / 5) * 5;
      const estimatedPrice = this.estimateUnitPrice(item) * roundedQty;
      return {
        itemId: item.id,
        itemName: item.name,
        quantity: roundedQty,
        unit: item.unit,
        estimatedPrice: Math.round(estimatedPrice * 100) / 100,
      };
    });

    if (pendingOrders.length > 0) {
      const order = pendingOrders[0];
      const mergedItems = [...order.items];
      for (const ni of newItems) {
        const idx = mergedItems.findIndex((m) => m.itemId === ni.itemId);
        if (idx >= 0) {
          const qty = Math.max(mergedItems[idx].quantity, ni.quantity);
          mergedItems[idx] = {
            ...mergedItems[idx],
            quantity: qty,
            estimatedPrice: Math.round(this.estimateUnitPrice(lowStockItems.find(i => i.id === ni.itemId)!) * qty * 100) / 100,
          };
        } else {
          mergedItems.push(ni);
        }
      }
      const totalAmount = mergedItems.reduce((sum, it) => sum + it.estimatedPrice, 0);
      const updated = purchaseOrderRepository.update(order.id, {
        items: mergedItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
      return updated!;
    }

    const totalAmount = newItems.reduce((sum, it) => sum + it.estimatedPrice, 0);
    const orderNo = `PO${dayjs().format('YYYYMMDDHHmmss')}`;
    const titles = [...new Set(lowStockItems.map((i) => i.category))];

    return purchaseOrderRepository.create({
      orderNo,
      title: `库存预警自动采购 - ${titles.join('/')} - ${dayjs().format('MM-DD')}`,
      items: newItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'PENDING_L1',
      currentLevel: 1,
      createdBy: 'SYSTEM_AUTO',
      createdAt: dayjs().toISOString(),
      source: 'INVENTORY_ALERT',
      approvals: [
        { level: 1, approved: false },
        { level: 2, approved: false },
        { level: 3, approved: false },
      ],
    });
  }

  private static estimateUnitPrice(item: InventoryItem): number {
    const priceMap: Record<string, number> = {
      蔬菜: 5, 肉类: 40, 米面: 6, 调料: 15, 油料: 20, 冻品: 35,
    };
    return priceMap[item.category] || 10;
  }

  static submitPurchaseOrder(orderId: string, createdBy: string): PurchaseOrder {
    const order = purchaseOrderRepository.findById(orderId);
    if (!order) {
      throw new Error('采购单不存在');
    }
    if (order.status !== 'DRAFT') {
      throw new Error('只能提交草稿状态的采购单');
    }
    if (order.items.length === 0) {
      throw new Error('采购单不能为空');
    }

    const updated = purchaseOrderRepository.update(orderId, {
      status: 'PENDING_L1',
      currentLevel: 1,
      createdBy,
    });

    return updated!;
  }

  static getPurchaseOrders(status?: PurchaseOrder['status']): PurchaseOrder[] {
    const orders = purchaseOrderRepository.findAll();
    if (status) {
      return orders.filter((o) => o.status === status);
    }
    return orders;
  }

  static getLowStockSummary(): {
    totalItems: number;
    warningCount: number;
    criticalCount: number;
    byCategory: { category: string; warning: number; critical: number }[];
  } {
    const items = this.getInventory();
    let warningCount = 0;
    let criticalCount = 0;
    const categoryMap = new Map<string, { warning: number; critical: number }>();

    for (const item of items) {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, { warning: 0, critical: 0 });
      }
      const cat = categoryMap.get(item.category)!;
      if (item.status === 'WARNING') {
        warningCount++;
        cat.warning++;
      } else if (item.status === 'CRITICAL') {
        criticalCount++;
        cat.critical++;
      }
    }

    return {
      totalItems: items.length,
      warningCount,
      criticalCount,
      byCategory: Array.from(categoryMap.entries()).map(([category, counts]) => ({
        category,
        ...counts,
      })),
    };
  }
}
