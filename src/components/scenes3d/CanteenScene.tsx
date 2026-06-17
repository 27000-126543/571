import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Text, Line } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { Dish, InventoryItem } from '../../../shared/types';

export interface CanteenSceneProps {
  dishes?: Dish[];
  inventory?: InventoryItem[];
}

const WINDOW_CONFIGS = [
  { id: 'w1', name: '1号窗口·家常菜', color: '#e63946', x: -10 },
  { id: 'w2', name: '2号窗口·面食', color: '#FCA311', x: -6 },
  { id: 'w3', name: '3号窗口·轻食', color: '#2EC4B6', x: -2 },
  { id: 'w4', name: '4号窗口·汤品', color: '#1d4ed8', x: 2 },
  { id: 'w5', name: '5号窗口·烧烤', color: '#7c3aed', x: 6 },
  { id: 'w6', name: '6号窗口·饮品', color: '#0891b2', x: 10 },
];

const DEFAULT_DISHES: Dish[] = [
  {
    id: 'd1', name: '红烧肉盖饭', windowId: 'w1', windowName: '1号窗口·家常菜',
    category: '热菜', price: 15, nutrition: { calories: 620, protein: 22, fat: 18, carbohydrate: 75, sodium: 850 },
    ingredients: ['五花肉', '大米'], soldToday: 186, remainingServings: 64,
    position3D: { x: -10, y: 0, z: -8 },
  },
  {
    id: 'd2', name: '蜜汁鸡排饭', windowId: 'w1', windowName: '1号窗口·家常菜',
    category: '热菜', price: 16, nutrition: { calories: 580, protein: 32, fat: 16, carbohydrate: 70, sodium: 920 },
    ingredients: ['鸡胸肉', '大米'], soldToday: 176, remainingServings: 24,
    position3D: { x: -10, y: 0, z: -9.2 },
  },
  {
    id: 'd3', name: '番茄牛腩面', windowId: 'w2', windowName: '2号窗口·面食',
    category: '主食', price: 18, nutrition: { calories: 540, protein: 28, fat: 15, carbohydrate: 68, sodium: 1200 },
    ingredients: ['牛腩', '番茄', '面条'], soldToday: 142, remainingServings: 38,
    position3D: { x: -6, y: 0, z: -8 },
  },
  {
    id: 'd4', name: '手工水饺', windowId: 'w2', windowName: '2号窗口·面食',
    category: '主食', price: 12, nutrition: { calories: 420, protein: 18, fat: 14, carbohydrate: 56, sodium: 680 },
    ingredients: ['猪肉', '白菜', '面粉'], soldToday: 158, remainingServings: 12,
    position3D: { x: -6, y: 0, z: -9.2 },
  },
  {
    id: 'd5', name: '清炒时蔬', windowId: 'w3', windowName: '3号窗口·轻食',
    category: '热菜', price: 8, nutrition: { calories: 120, protein: 5, fat: 4, carbohydrate: 18, sodium: 320 },
    ingredients: ['西兰花', '胡萝卜'], soldToday: 205, remainingServings: 95,
    position3D: { x: -2, y: 0, z: -8 },
  },
  {
    id: 'd6', name: '藜麦沙拉', windowId: 'w3', windowName: '3号窗口·轻食',
    category: '凉菜', price: 14, nutrition: { calories: 280, protein: 12, fat: 10, carbohydrate: 35, sodium: 280 },
    ingredients: ['藜麦', '生菜'], soldToday: 88, remainingServings: 42,
    position3D: { x: -2, y: 0, z: -9.2 },
  },
  {
    id: 'd7', name: '西湖牛肉羹', windowId: 'w4', windowName: '4号窗口·汤品',
    category: '汤羹', price: 6, nutrition: { calories: 180, protein: 12, fat: 6, carbohydrate: 15, sodium: 780 },
    ingredients: ['牛肉末', '鸡蛋'], soldToday: 98, remainingServings: 52,
    position3D: { x: 2, y: 0, z: -8 },
  },
  {
    id: 'd8', name: '紫菜蛋花汤', windowId: 'w4', windowName: '4号窗口·汤品',
    category: '汤羹', price: 4, nutrition: { calories: 80, protein: 6, fat: 3, carbohydrate: 8, sodium: 520 },
    ingredients: ['紫菜', '鸡蛋'], soldToday: 156, remainingServings: 88,
    position3D: { x: 2, y: 0, z: -9.2 },
  },
  {
    id: 'd9', name: '烤羊肉串', windowId: 'w5', windowName: '5号窗口·烧烤',
    category: '小吃', price: 5, nutrition: { calories: 150, protein: 10, fat: 11, carbohydrate: 2, sodium: 350 },
    ingredients: ['羊肉'], soldToday: 320, remainingServings: 80,
    position3D: { x: 6, y: 0, z: -8 },
  },
  {
    id: 'd10', name: '烤鸡翅', windowId: 'w5', windowName: '5号窗口·烧烤',
    category: '小吃', price: 8, nutrition: { calories: 220, protein: 18, fat: 15, carbohydrate: 3, sodium: 480 },
    ingredients: ['鸡翅'], soldToday: 210, remainingServings: 30,
    position3D: { x: 6, y: 0, z: -9.2 },
  },
  {
    id: 'd11', name: '鲜榨橙汁', windowId: 'w6', windowName: '6号窗口·饮品',
    category: '饮品', price: 10, nutrition: { calories: 120, protein: 1, fat: 0, carbohydrate: 28, sodium: 10 },
    ingredients: ['橙子'], soldToday: 145, remainingServings: 55,
    position3D: { x: 10, y: 0, z: -8 },
  },
  {
    id: 'd12', name: '珍珠奶茶', windowId: 'w6', windowName: '6号窗口·饮品',
    category: '饮品', price: 12, nutrition: { calories: 380, protein: 2, fat: 8, carbohydrate: 72, sodium: 120 },
    ingredients: ['奶茶', '珍珠'], soldToday: 198, remainingServings: 2,
    position3D: { x: 10, y: 0, z: -9.2 },
  },
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: '东北大米', category: '米面', unit: 'kg', currentStock: 180, safetyThreshold: 200, dailyConsumption: 80, lastPurchasedAt: '2026-06-10', supplierName: '绿源粮油', status: 'WARNING' },
  { id: 'i2', name: '一级大豆油', category: '油料', unit: 'L', currentStock: 45, safetyThreshold: 50, dailyConsumption: 15, lastPurchasedAt: '2026-06-12', supplierName: '金龙鱼直供', status: 'WARNING' },
  { id: 'i3', name: '新鲜西兰花', category: '蔬菜', unit: 'kg', currentStock: 12, safetyThreshold: 30, dailyConsumption: 18, lastPurchasedAt: '2026-06-16', supplierName: '本地蔬菜基地', status: 'CRITICAL' },
  { id: 'i4', name: '五花肉', category: '肉类', unit: 'kg', currentStock: 85, safetyThreshold: 40, dailyConsumption: 20, lastPurchasedAt: '2026-06-16', supplierName: '双汇冷鲜', status: 'NORMAL' },
];

function InventoryAlertSphere({ position, severity }: { position: [number, number, number]; severity: 'WARNING' | 'CRITICAL' }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + 0.15 * Math.sin(t * 4);
      meshRef.current.scale.setScalar(scale);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + 0.5 * (Math.sin(t * 3) * 0.5 + 0.5);
    }
  });

  const color = severity === 'CRITICAL' ? '#dc2626' : '#f59e0b';

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.9} />
    </mesh>
  );
}

function DishDisplay({ dish }: { dish: Dish }) {
  const [hovered, setHovered] = useState(false);
  const colors = ['#e63946', '#FCA311', '#2EC4B6', '#1d4ed8', '#7c3aed', '#0891b2', '#db2777', '#16a34a'];
  const colorIndex = parseInt(dish.id.replace(/\D/g, '')) % colors.length;
  const isLow = dish.remainingServings < 30;

  return (
    <group
      position={[dish.position3D.x, 1.5, dish.position3D.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.4, 0.05, 0.5]} />
        <meshStandardMaterial color="#f5f5f4" />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        {dish.category === '汤羹' ? (
          <cylinderGeometry args={[0.18, 0.15, 0.2, 16]} />
        ) : dish.category === '饮品' ? (
          <cylinderGeometry args={[0.1, 0.12, 0.35, 16]} />
        ) : (
          <sphereGeometry args={[0.18, 16, 16]} />
        )}
        <meshStandardMaterial
          color={colors[colorIndex]}
          emissive={isLow ? '#ef4444' : '#000000'}
          emissiveIntensity={isLow ? 0.3 : 0}
        />
      </mesh>

      {hovered && (
        <Html position={[0, 1, 0]} center distanceFactor={8}>
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 shadow-2xl min-w-[180px] whitespace-nowrap">
            <div className="font-bold text-sm text-white mb-1">{dish.name}</div>
            <div className="text-xs text-gray-400 mb-2">{dish.windowName}</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">价格</span>
              <span className="font-bold text-danger">¥{dish.price}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center mb-2 py-2 px-1 rounded-lg bg-bg-lighter">
              <div>
                <div className="text-[10px] font-bold text-danger">{dish.nutrition.calories}</div>
                <div className="text-[9px] text-gray-500">卡</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-warning">{dish.nutrition.protein}g</div>
                <div className="text-[9px] text-gray-500">蛋白</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-primary-300">{dish.nutrition.carbohydrate}g</div>
                <div className="text-[9px] text-gray-500">碳水</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-success">{dish.nutrition.fat}g</div>
                <div className="text-[9px] text-gray-500">脂肪</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isLow ? 'text-danger font-medium' : 'text-success'}>
                剩余 {dish.remainingServings} 份
              </span>
              <span className="text-gray-500">已售 {dish.soldToday}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function ServiceWindow({
  config,
  dishes,
  alertItems,
}: {
  config: typeof WINDOW_CONFIGS[number];
  dishes: Dish[];
  alertItems: InventoryItem[];
}) {
  return (
    <group position={[config.x, 0, -8]}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[3.5, 2.5, 0.5]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 1.25, 0.26]}>
        <boxGeometry args={[3.4, 2.4, 0.02]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-1.71, 1.25, 0]}>
        <boxGeometry args={[0.08, 2.5, 0.55]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.71, 1.25, 0]}>
        <boxGeometry args={[0.08, 2.5, 0.55]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 2.51, 0]}>
        <boxGeometry args={[3.5, 0.08, 0.55]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[0, 2.9, 0]} scale={[3, 0.6, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#000000" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, 2.9, 0.01]}
        fontSize={0.35}
        color={config.color}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {config.name}
      </Text>

      <mesh position={[0, 0.8, 0.4]} castShadow>
        <boxGeometry args={[3.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {dishes.map((dish) => (
        <DishDisplay key={dish.id} dish={dish} />
      ))}

      {alertItems.map((item, i) => (
        <InventoryAlertSphere
          key={item.id}
          position={[-1.2 + i * 0.8, 3.2, 0.3]}
          severity={item.status as 'WARNING' | 'CRITICAL'}
        />
      ))}

      {alertItems.length > 0 && (
        <Html position={[0, 3.8, 0]} center distanceFactor={12}>
          <div className="bg-danger/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg animate-pulse">
            ⚠️ {alertItems.length}项库存预警
          </div>
        </Html>
      )}
    </group>
  );
}

function DiningTable({
  position,
  occupiedCount = 0,
}: {
  position: [number, number, number];
  occupiedCount?: number;
}) {
  const occupiedSeats = useMemo(() => {
    const arr = new Array(4).fill(false);
    for (let i = 0; i < occupiedCount; i++) {
      arr[i] = true;
    }
    return arr.sort(() => Math.random() - 0.5);
  }, [occupiedCount]);

  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.08, 24]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 12]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>

      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const x = Math.cos(angle) * 0.9;
        const z = Math.sin(angle) * 0.9;
        const isOccupied = occupiedSeats[i];
        return (
          <mesh
            key={i}
            position={[x, 0.3, z]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            castShadow
          >
            <boxGeometry args={[0.35, 0.4, 0.35]} />
            <meshStandardMaterial
              color={isOccupied ? '#6b7280' : '#e5e7eb'}
              emissive={isOccupied ? '#374151' : '#000000'}
              emissiveIntensity={isOccupied ? 0.2 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function QueueLine({ windowX }: { windowX: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      pts.push([windowX, 0.02, -6 + i * 0.8]);
    }
    return pts;
  }, [windowX]);

  return (
    <group>
      <Line
        points={points}
        color="#FCA311"
        lineWidth={2}
        dashed
        dashSize={0.2}
        gapSize={0.15}
      />
      <mesh position={[windowX, 0.1, -1.5]}>
        <boxGeometry args={[0.8, 0.4, 0.15]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <Text
        position={[windowX, 0.12, -1.4]}
        fontSize={0.15}
        color="#FCA311"
        anchorX="center"
        anchorY="middle"
      >
        排队 3人
      </Text>
    </group>
  );
}

function EntryPath() {
  const points: [number, number, number][] = [
    [0, 0.02, 9.5],
    [0, 0.02, 6],
    [-8, 0.02, 0],
    [-8, 0.02, -5],
  ];

  return (
    <group>
      <Line
        points={points}
        color="#2EC4B6"
        lineWidth={3}
        dashed
        dashSize={0.4}
        gapSize={0.3}
      />
      <mesh position={[0, 0.15, 9.3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
        <meshStandardMaterial color="#2EC4B6" emissive="#2EC4B6" emissiveIntensity={0.5} />
      </mesh>
      <Text
        position={[0, 0.4, 9.3]}
        fontSize={0.3}
        color="#2EC4B6"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        入口
      </Text>
    </group>
  );
}

function CanteenRoom() {
  const width = 30;
  const height = 5;
  const depth = 20;
  const wallT = 0.2;
  const opacity = 0.3;

  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#e8e4df" />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2]}>
        <boxGeometry args={[width, height, wallT]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]}>
        <boxGeometry args={[width, height, wallT]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[wallT, height, depth]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[wallT, height, depth]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width, wallT, depth]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {[-10, -2, 6].map((x, i) => (
        <mesh key={`light-${i}`} position={[x, height - 0.1, 0]}>
          <pointLight intensity={1} distance={15} color="#fff5e1" />
        </mesh>
      ))}
      {[-10, -2, 6].map((x, i) => (
        <mesh key={`light-2-${i}`} position={[x, height - 0.1, 5]}>
          <pointLight intensity={0.8} distance={12} color="#fff5e1" />
        </mesh>
      ))}
    </group>
  );
}

function SceneContent({ dishes: dishesProp, inventory: invProp }: CanteenSceneProps) {
  const dishes = dishesProp || DEFAULT_DISHES;
  const inventory = invProp || DEFAULT_INVENTORY;

  const alertItemsByWindow = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    const windowIds = WINDOW_CONFIGS.map((w) => w.id);
    inventory
      .filter((i) => i.status !== 'NORMAL')
      .forEach((item, idx) => {
        const wid = windowIds[idx % windowIds.length];
        if (!map[wid]) map[wid] = [];
        map[wid].push(item);
      });
    return map;
  }, [inventory]);

  const diningTables = useMemo(() => {
    const tables: { pos: [number, number, number]; occupied: number }[] = [];
    const rows = 4;
    const cols = 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * 7 + c * 13;
        tables.push({
          pos: [-9.6 + c * 4.8, 0, 2 + r * 3.5],
          occupied: seed % 5,
        });
      }
    }
    return tables;
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[15, 18, 12]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <CanteenRoom />
      <EntryPath />

      {WINDOW_CONFIGS.map((config) => (
        <ServiceWindow
          key={config.id}
          config={config}
          dishes={dishes.filter((d) => d.windowId === config.id)}
          alertItems={alertItemsByWindow[config.id] || []}
        />
      ))}

      {WINDOW_CONFIGS.map((config) => (
        <QueueLine key={`q-${config.id}`} windowX={config.x} />
      ))}

      {diningTables.map((t, i) => (
        <DiningTable key={i} position={t.pos} occupiedCount={t.occupied} />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={8}
        maxDistance={45}
        target={[0, 1, 0]}
      />
    </>
  );
}

export default function CanteenScene(props: CanteenSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [18, 12, 15], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 30, 60]} />
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
