import { useState } from 'react';
import Layout from '../components/Layout';
import { CanteenScene } from '../components/scenes3d';
import {
  UtensilsCrossed,
  Flame,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  ShoppingCart,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
} from 'lucide-react';
import type { Dish, InventoryItem, PurchaseOrder, Nutrition } from '../../shared/types';

const mockDishes: Dish[] = [
  {
    id: 'd1',
    name: '红烧肉盖饭',
    windowId: 'w1',
    windowName: '1号窗口·家常菜',
    category: '热菜',
    price: 15,
    nutrition: { calories: 620, protein: 22, fat: 18, carbohydrate: 75, sodium: 850 },
    ingredients: ['五花肉', '大米', '酱油', '冰糖', '八角'],
    soldToday: 186,
    remainingServings: 64,
    position3D: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'd2',
    name: '番茄牛腩面',
    windowId: 'w2',
    windowName: '2号窗口·面食',
    category: '主食',
    price: 18,
    nutrition: { calories: 540, protein: 28, fat: 15, carbohydrate: 68, sodium: 1200 },
    ingredients: ['牛腩', '番茄', '面条', '洋葱'],
    soldToday: 142,
    remainingServings: 38,
    position3D: { x: 1, y: 0, z: 0 },
  },
  {
    id: 'd3',
    name: '清炒时蔬',
    windowId: 'w3',
    windowName: '3号窗口·轻食',
    category: '热菜',
    price: 8,
    nutrition: { calories: 120, protein: 5, fat: 4, carbohydrate: 18, sodium: 320 },
    ingredients: ['西兰花', '胡萝卜', '木耳', '蒜末'],
    allergens: [],
    soldToday: 205,
    remainingServings: 95,
    position3D: { x: 2, y: 0, z: 0 },
  },
  {
    id: 'd4',
    name: '西湖牛肉羹',
    windowId: 'w4',
    windowName: '4号窗口·汤品',
    category: '汤羹',
    price: 6,
    nutrition: { calories: 180, protein: 12, fat: 6, carbohydrate: 15, sodium: 780 },
    ingredients: ['牛肉末', '鸡蛋', '豆腐', '香菜'],
    soldToday: 98,
    remainingServings: 52,
    position3D: { x: 3, y: 0, z: 0 },
  },
  {
    id: 'd5',
    name: '蜜汁鸡排饭',
    windowId: 'w1',
    windowName: '1号窗口·家常菜',
    category: '热菜',
    price: 16,
    nutrition: { calories: 580, protein: 32, fat: 16, carbohydrate: 70, sodium: 920 },
    ingredients: ['鸡胸肉', '大米', '蜂蜜', '生抽'],
    soldToday: 176,
    remainingServings: 24,
    position3D: { x: 4, y: 0, z: 0 },
  },
  {
    id: 'd6',
    name: '手工水饺',
    windowId: 'w2',
    windowName: '2号窗口·面食',
    category: '主食',
    price: 12,
    nutrition: { calories: 420, protein: 18, fat: 14, carbohydrate: 56, sodium: 680 },
    ingredients: ['猪肉', '白菜', '面粉', '葱姜'],
    allergens: ['麸质'],
    soldToday: 158,
    remainingServings: 12,
    position3D: { x: 5, y: 0, z: 0 },
  },
];

const mockInventory: InventoryItem[] = [
  { id: 'i1', name: '东北大米', category: '米面', unit: 'kg', currentStock: 180, safetyThreshold: 200, dailyConsumption: 80, lastPurchasedAt: '2026-06-10', supplierName: '绿源粮油', status: 'WARNING' },
  { id: 'i2', name: '一级大豆油', category: '油料', unit: 'L', currentStock: 45, safetyThreshold: 50, dailyConsumption: 15, lastPurchasedAt: '2026-06-12', supplierName: '金龙鱼直供', status: 'WARNING' },
  { id: 'i3', name: '五花肉', category: '肉类', unit: 'kg', currentStock: 85, safetyThreshold: 40, dailyConsumption: 20, lastPurchasedAt: '2026-06-16', supplierName: '双汇冷鲜', status: 'NORMAL' },
  { id: 'i4', name: '鸡胸肉', category: '肉类', unit: 'kg', currentStock: 120, safetyThreshold: 50, dailyConsumption: 25, lastPurchasedAt: '2026-06-15', supplierName: '圣农食品', status: 'NORMAL' },
  { id: 'i5', name: '新鲜西兰花', category: '蔬菜', unit: 'kg', currentStock: 12, safetyThreshold: 30, dailyConsumption: 18, lastPurchasedAt: '2026-06-16', supplierName: '本地蔬菜基地', status: 'CRITICAL' },
  { id: 'i6', name: '番茄', category: '蔬菜', unit: 'kg', currentStock: 35, safetyThreshold: 40, dailyConsumption: 22, lastPurchasedAt: '2026-06-16', supplierName: '本地蔬菜基地', status: 'WARNING' },
  { id: 'i7', name: '食用盐', category: '调料', unit: 'kg', currentStock: 55, safetyThreshold: 20, dailyConsumption: 2, lastPurchasedAt: '2026-06-01', supplierName: '中盐集团', status: 'NORMAL' },
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    orderNo: 'PO-2026-0617-001',
    title: '6月中旬蔬菜采购',
    items: [
      { itemId: 'i5', itemName: '新鲜西兰花', quantity: 80, unit: 'kg', estimatedPrice: 8 },
      { itemId: 'i6', itemName: '番茄', quantity: 100, unit: 'kg', estimatedPrice: 6 },
    ],
    totalAmount: 1240,
    status: 'PENDING_L1',
    currentLevel: 1,
    createdBy: '后勤主任',
    createdAt: '2026-06-17 09:30:00',
    approvals: [{ level: 1, approved: false }, { level: 2, approved: false }, { level: 3, approved: false }],
  },
  {
    id: 'po2',
    orderNo: 'PO-2026-0617-002',
    title: '米面油紧急补货',
    items: [
      { itemId: 'i1', itemName: '东北大米', quantity: 500, unit: 'kg', estimatedPrice: 6 },
      { itemId: 'i2', itemName: '一级大豆油', quantity: 200, unit: 'L', estimatedPrice: 12 },
    ],
    totalAmount: 5400,
    status: 'PENDING_L2',
    currentLevel: 2,
    createdBy: '食堂管理员',
    createdAt: '2026-06-17 08:15:00',
    approvals: [
      { level: 1, approved: true, approverName: '后勤主任', approvedAt: '2026-06-17 08:45:00' },
      { level: 2, approved: false },
      { level: 3, approved: false },
    ],
  },
  {
    id: 'po3',
    orderNo: 'PO-2026-0616-005',
    title: '肉类月度采购',
    items: [
      { itemId: 'i3', itemName: '五花肉', quantity: 300, unit: 'kg', estimatedPrice: 32 },
      { itemId: 'i4', itemName: '鸡胸肉', quantity: 400, unit: 'kg', estimatedPrice: 18 },
    ],
    totalAmount: 16800,
    status: 'APPROVED',
    currentLevel: 3,
    createdBy: '后勤主任',
    createdAt: '2026-06-16 14:20:00',
    approvals: [
      { level: 1, approved: true, approverName: '后勤主任', approvedAt: '2026-06-16 15:00:00' },
      { level: 2, approved: true, approverName: '德育主任', approvedAt: '2026-06-16 16:30:00' },
      { level: 3, approved: true, approverName: '校长', approvedAt: '2026-06-16 17:45:00' },
    ],
  },
];

function NutritionRing({ nutrition, maxCalories = 800 }: { nutrition: Nutrition; maxCalories?: number }) {
  const percent = Math.min((nutrition.calories / maxCalories) * 100, 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(48, 54, 61, 0.5)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2EC4B6" />
            <stop offset="50%" stopColor="#FCA311" />
            <stop offset="100%" stopColor="#E63946" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-orbitron text-sm font-bold text-white">{nutrition.calories}</div>
        <div className="text-[9px] text-gray-500">卡路里</div>
      </div>
    </div>
  );
}

export default function CanteenPage() {
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [ordersTab, setOrdersTab] = useState<'pending' | 'all'>('pending');
  const [searchDish, setSearchDish] = useState('');

  const filteredDishes = mockDishes.filter(d =>
    searchDish ? d.name.includes(searchDish) || d.windowName.includes(searchDish) : true
  );

  const filteredOrders = ordersTab === 'pending'
    ? mockPurchaseOrders.filter(o => o.status.startsWith('PENDING'))
    : mockPurchaseOrders;

  const handleApprove = (orderId: string) => {
    console.log('Approve:', orderId);
  };

  const handleReject = (orderId: string) => {
    console.log('Reject:', orderId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <UtensilsCrossed className="w-7 h-7 text-danger" />
              食堂智慧管理
            </h2>
            <p className="text-gray-500 mt-1">菜品管理、库存监控、采购审批一体化</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-card border border-bg-border text-gray-400 hover:text-white hover:border-primary/30 transition-all">
              <FileText className="w-4 h-4" />
              <span>今日报表</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white font-medium">
              <Plus className="w-4 h-4" />
              <span>新建采购单</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flame className="w-5 h-5 text-warning" />
                菜品营养
              </h3>
              <span className="text-sm text-gray-500">{filteredDishes.length} 道</span>
            </div>
            <div className="space-y-3 max-h-[calc(100vh - 180px)] overflow-y-auto pr-1">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="rounded-xl bg-bg-card border border-bg-border p-3 hover:border-warning/30 transition-all cursor-pointer"
                >
                  <div className="flex gap-3">
                    <NutritionRing nutrition={dish.nutrition} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{dish.name}</div>
                      <div className="text-xs text-gray-500 truncate mb-1">{dish.windowName}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-orbitron text-lg font-bold text-danger">¥{dish.price}</span>
                        <span className="text-[10px] text-gray-500">/份</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center mt-3 pt-3 border-t border-bg-border/50">
                    <div>
                      <div className="text-[10px] font-bold text-danger">{dish.nutrition.protein}g</div>
                      <div className="text-[9px] text-gray-500">蛋白</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-warning">{dish.nutrition.fat}g</div>
                      <div className="text-[9px] text-gray-500">脂肪</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-primary-300">{dish.nutrition.carbohydrate}g</div>
                      <div className="text-[9px] text-gray-500">碳水</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-success">{dish.nutrition.sodium || 0}mg</div>
                      <div className="text-[9px] text-gray-500">钠</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700/50" style={{ height: 'calc(100vh - 120px)' }}>
              <CanteenScene dishes={filteredDishes} inventory={mockInventory} />
            </div>
          </div>

          <div className="w-80 flex-shrink-0 space-y-6">
            <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
              <button
                onClick={() => setInventoryExpanded(!inventoryExpanded)}
                className="w-full p-4 border-b border-bg-border flex items-center justify-between hover:bg-bg-light/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-warning" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">实时库存</h3>
                    <p className="text-[10px] text-gray-500">
                      {mockInventory.filter(i => i.status !== 'NORMAL').length} 项预警
                    </p>
                  </div>
                </div>
                {inventoryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {inventoryExpanded && (
                <div className="overflow-y-auto max-h-[240px]">
                  {mockInventory.map((item) => {
                    const isLow = item.status !== 'NORMAL';
                    return (
                      <div
                        key={item.id}
                        className={`p-3 border-b border-bg-border/50 last:border-0 ${
                          item.status === 'CRITICAL' ? 'bg-danger/10' :
                          item.status === 'WARNING' ? 'bg-warning/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.status === 'NORMAL' ? (
                            <span className="badge badge-success text-[10px]">正常</span>
                          ) : item.status === 'WARNING' ? (
                            <span className="badge badge-warning text-[10px] flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              预警
                            </span>
                          ) : (
                            <span className="badge badge-danger text-[10px] flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              紧急
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            <span className={`font-bold ${
                              item.status === 'CRITICAL' ? 'text-danger' :
                              item.status === 'WARNING' ? 'text-warning' : ''
                            }`}>{item.currentStock}</span> {item.unit}
                          </span>
                          <span>阈值 {item.safetyThreshold}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
              <div className="p-4 border-b border-bg-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">采购审批</h3>
                      <p className="text-[10px] text-gray-500">{filteredOrders.length} 条</p>
                    </div>
                  </div>
                </div>
                <div className="flex p-0.5 rounded-lg bg-bg-lighter">
                  <button
                    onClick={() => setOrdersTab('pending')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      ordersTab === 'pending' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    待审 ({mockPurchaseOrders.filter(o => o.status.startsWith('PENDING')).length})
                  </button>
                  <button
                    onClick={() => setOrdersTab('all')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      ordersTab === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    全部
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[320px] p-3 space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-bg-border bg-bg-light/40 p-3 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{order.title}</div>
                        <p className="text-[10px] text-gray-500">{order.orderNo}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron font-bold text-warning">¥{order.totalAmount}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {order.items.slice(0, 2).map((it, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-bg-lighter text-gray-400">
                          {it.itemName}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-bg-lighter text-gray-500">
                          +{order.items.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-bg-border/50">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((lv) => {
                          const approval = order.approvals.find(a => a.level === lv);
                          const done = approval?.approved;
                          return (
                            <div key={lv} className="flex items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                done ? 'bg-success/20 text-success border border-success/30' :
                                lv === order.currentLevel && order.status.startsWith('PENDING')
                                  ? 'bg-warning/20 text-warning border border-warning/30 animate-pulse'
                                  : 'bg-bg-lighter text-gray-500 border border-bg-border'
                              }`}>
                                {done ? <CheckCircle className="w-3 h-3" /> : lv}
                              </div>
                              {lv < 3 && <div className={`w-4 h-0.5 ${done ? 'bg-success/30' : 'bg-bg-border'}`}></div>}
                            </div>
                          );
                        })}
                      </div>

                      {order.status.startsWith('PENDING') && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleReject(order.id)}
                            className="px-2 py-1 rounded-md text-[10px] bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 flex items-center gap-1 transition-all"
                          >
                            <ThumbsDown className="w-2.5 h-2.5" />
                            驳回
                          </button>
                          <button
                            onClick={() => handleApprove(order.id)}
                            className="px-2 py-1 rounded-md text-[10px] bg-success/10 text-success border border-success/30 hover:bg-success/20 flex items-center gap-1 transition-all"
                          >
                            <ThumbsUp className="w-2.5 h-2.5" />
                            通过
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
