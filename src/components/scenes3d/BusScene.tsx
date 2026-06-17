import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import type { Bus, BusAnomaly } from '../../../shared/types';

export interface BusSceneProps {
  buses?: Bus[];
  anomaly?: BusAnomaly | null;
  showInternal?: boolean;
  selectedBusId?: string;
  onSelectBus?: (busId: string) => void;
}

const BUS_COLORS = ['#FCA311', '#2EC4B6', '#E63946', '#1d4ed8', '#7c3aed'];

const DEFAULT_BUSES: Bus[] = [
  {
    id: 'b1', busNumber: '校巴01', plateNumber: '京A·12345',
    routeId: 'r1', routeName: '1号线·城东线',
    driverName: '王师傅', driverPhone: '138****1234',
    capacity: 40, currentOccupancy: 32, status: 'ON_ROUTE',
    currentPosition: { lat: 39.9042, lng: 116.4074, timestamp: new Date().toISOString(), speed: 38, heading: 90 },
    position3D: { x: -12, y: 0, z: 0, rotationY: 0 },
    estimatedArrival: '3分钟后', nextStation: '阳光花园站',
    onboardStudents: Array.from({ length: 5 }, (_, i) => ({
      studentId: `s${i + 1}`, studentName: ['张三', '李四', '王五', '赵六', '孙七'][i],
      grade: [1, 2, 3, 1, 2][i], className: ['1班', '2班', '3班', '1班', '2班'][i],
      parentPhone: `139****${String(1000 + i).padStart(4, '0')}`,
      boardedAt: new Date().toISOString(), boardStation: '起点站',
    })),
  },
  {
    id: 'b2', busNumber: '校巴02', plateNumber: '京A·23456',
    routeId: 'r2', routeName: '2号线·城西线',
    driverName: '李师傅', driverPhone: '138****2345',
    capacity: 40, currentOccupancy: 18, status: 'ON_ROUTE',
    currentPosition: { lat: 39.9142, lng: 116.3874, timestamp: new Date().toISOString(), speed: 25, heading: 180 },
    position3D: { x: -4, y: 0, z: 0, rotationY: 0 },
    estimatedArrival: '8分钟后', nextStation: '翠湖小区站',
    onboardStudents: [],
  },
  {
    id: 'b3', busNumber: '校巴03', plateNumber: '京A·34567',
    routeId: 'r3', routeName: '3号线·城南线',
    driverName: '张师傅', driverPhone: '138****3456',
    capacity: 40, currentOccupancy: 0, status: 'AT_SCHOOL',
    currentPosition: { lat: 39.92, lng: 116.42, timestamp: new Date().toISOString(), speed: 0, heading: 0 },
    position3D: { x: 4, y: 0, z: 0, rotationY: 0 },
    estimatedArrival: '已到校', nextStation: '学校停车场',
    onboardStudents: [],
  },
  {
    id: 'b4', busNumber: '校巴04', plateNumber: '京A·45678',
    routeId: 'r4', routeName: '4号线·城北线',
    driverName: '赵师傅', driverPhone: '138****4567',
    capacity: 40, currentOccupancy: 28, status: 'DELAYED',
    currentPosition: { lat: 39.935, lng: 116.41, timestamp: new Date().toISOString(), speed: 5, heading: 270 },
    position3D: { x: 12, y: 0, z: 0, rotationY: 0 },
    estimatedArrival: '延误20分钟', nextStation: '科技园站',
    onboardStudents: [],
  },
  {
    id: 'b5', busNumber: '校巴05', plateNumber: '京A·56789',
    routeId: 'r5', routeName: '5号线·机场线',
    driverName: '刘师傅', driverPhone: '138****5678',
    capacity: 30, currentOccupancy: 12, status: 'AT_STATION',
    currentPosition: { lat: 39.85, lng: 116.45, timestamp: new Date().toISOString(), speed: 0, heading: 45 },
    position3D: { x: 0, y: 0, z: 6, rotationY: 0 },
    estimatedArrival: '停靠中', nextStation: '南苑小区站',
    onboardStudents: [],
  },
];

function BusRoofLight() {
  const lightRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.elapsedTime;
      const mat = lightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + 0.7 * (Math.sin(t * 5) * 0.5 + 0.5);
    }
  });
  return (
    <mesh ref={lightRef} position={[0, 1.7, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="#FCA311" emissiveIntensity={0.6} />
    </mesh>
  );
}

function BusWheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.25, 24]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
  );
}

function BusModel({
  bus,
  colorIndex,
  anomaly,
  showInternal,
  selected,
  onSelect,
}: {
  bus: Bus;
  colorIndex: number;
  anomaly?: BusAnomaly | null;
  showInternal?: boolean;
  selected?: boolean;
  onSelect?: (busId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const outlineActive = anomaly?.busId === bus.id || selected;
  const busColor = BUS_COLORS[colorIndex % BUS_COLORS.length];

  const onboardSet = useMemo(() => {
    const set = new Set<string>();
    bus.onboardStudents.forEach((s) => set.add(s.studentId));
    return set;
  }, [bus.onboardStudents]);

  const seatLayout = useMemo(() => {
    const seats: { pos: [number, number, number]; onboard: boolean; studentName?: string }[] = [];
    const rows = Math.ceil(bus.capacity / 2);
    let seatIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        if (seatIdx >= bus.capacity) break;
        const student = bus.onboardStudents[seatIdx];
        seats.push({
          pos: [
            c === 0 ? -0.5 : 0.5,
            0.6,
            -2.2 + r * 0.55,
          ],
          onboard: !!student,
          studentName: student?.studentName,
        });
        seatIdx++;
      }
    }
    return seats;
  }, [bus.capacity, bus.onboardStudents]);

  return (
    <group
      ref={groupRef}
      position={[bus.position3D.x, bus.position3D.y, bus.position3D.z]}
      rotation={[0, bus.position3D.rotationY || 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(bus.id);
      }}
    >
      {outlineActive && (
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[6.1, 2.1, 2.3]} />
          <meshBasicMaterial
            color={selected && anomaly?.busId !== bus.id ? '#2EC4B6' : '#dc2626'}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[6, 2, 2.2]} />
        <meshStandardMaterial color={busColor} />
      </mesh>

      <mesh position={[-2.6, 0.1, 0]} castShadow>
        <boxGeometry args={[0.8, 1.3, 2.1]} />
        <meshStandardMaterial color={busColor} />
      </mesh>

      <mesh position={[2.6, 0.1, 0]} castShadow>
        <boxGeometry args={[0.6, 1, 2.1]} />
        <meshStandardMaterial color={busColor} />
      </mesh>

      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[5.8, 0.1, 2]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>

      {[-2, -0.8, 0.4, 1.6, 2.6].map((x, i) => (
        <group key={`window-side-${i}`}>
          <mesh position={[x, 0.9, 1.11]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.05]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} />
          </mesh>
          <mesh position={[x, 0.9, -1.11]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.05]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      <mesh position={[-2.2, 0.9, 1.06]}>
        <boxGeometry args={[0.8, 1.1, 0.04]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
      </mesh>

      <BusWheel position={[-2, -0.7, 0.9]} />
      <BusWheel position={[-2, -0.7, -0.9]} />
      <BusWheel position={[2, -0.7, 0.9]} />
      <BusWheel position={[2, -0.7, -0.9]} />

      <group position={[0.5, -0.2, 1.11]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 1.2, 1]} />
          <meshStandardMaterial color={busColor} />
        </mesh>
        <mesh position={[0.06, 0.35, 0]}>
          <boxGeometry args={[0.02, 0.25, 0.2]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0.06, 0.35, 0.3]}>
          <boxGeometry args={[0.02, 0.25, 0.2]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0.06, 0.35, -0.3]}>
          <boxGeometry args={[0.02, 0.25, 0.2]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </group>

      <BusRoofLight />

      <mesh position={[-2.8, 0.8, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[2.9, 0.9, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
      </mesh>

      <group position={[-2.6, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 0.6, 0.8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Text
          position={[0.04, 0, 0]}
          fontSize={0.22}
          color="#1f2937"
          anchorX="left"
          anchorY="middle"
          fontWeight="bold"
        >
          {bus.busNumber}
        </Text>
      </group>

      {showInternal && (
        <group>
          {seatLayout.map((seat, i) => (
            <group key={i} position={seat.pos}>
              <mesh castShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial
                  color={seat.onboard ? '#E63946' : '#9ca3af'}
                  emissive={seat.onboard ? '#E63946' : '#000000'}
                  emissiveIntensity={seat.onboard ? 0.3 : 0}
                />
              </mesh>
              {seat.onboard && seat.studentName && (
                <Html position={[0, 0.4, 0]} center distanceFactor={6} zIndexRange={[10, 0]}>
                  <div className="bg-bg-card/90 border border-bg-border rounded-md px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-lg">
                    {seat.studentName}
                  </div>
                </Html>
              )}
            </group>
          ))}
        </group>
      )}

      {hovered && (
        <Html position={[0, 3.2, 0]} center distanceFactor={10}>
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 shadow-2xl min-w-[200px] whitespace-nowrap">
            <div className="font-bold text-sm text-white mb-1">{bus.busNumber}</div>
            <div className="text-xs text-gray-400 mb-2">{bus.plateNumber}</div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-md ${
                  bus.status === 'ON_ROUTE'
                    ? 'bg-success/20 text-success'
                    : bus.status === 'DELAYED'
                    ? 'bg-danger/20 text-danger'
                    : bus.status === 'MAINTENANCE'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-primary/20 text-primary-300'
                }`}
              >
                {bus.status === 'ON_ROUTE' && '行驶中'}
                {bus.status === 'AT_STATION' && '靠站中'}
                {bus.status === 'AT_SCHOOL' && '已到校'}
                {bus.status === 'MAINTENANCE' && '维修中'}
                {bus.status === 'DELAYED' && '延误'}
              </span>
              {bus.currentPosition.speed > 0 && (
                <span className="text-xs text-gray-400">{bus.currentPosition.speed} km/h</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mb-1">
              🚏 {bus.nextStation}
            </div>
            <div className="text-xs text-gray-400 mb-1">
              🧑‍✈️ {bus.driverName}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-bg-border/50">
              <span className="text-xs text-gray-400">乘车</span>
              <span className="text-xs font-bold">
                <span className={bus.currentOccupancy >= bus.capacity * 0.9 ? 'text-danger' : 'text-warning'}>
                  {bus.currentOccupancy}
                </span>
                <span className="text-gray-500"> / {bus.capacity}</span>
              </span>
            </div>
          </div>
        </Html>
      )}

      {outlineActive && anomaly && (
        <Html position={[0, 3.5, 1.5]} center distanceFactor={10}>
          <div className="bg-danger/95 text-white rounded-xl p-3 shadow-2xl min-w-[220px] whitespace-normal animate-pulse border border-danger">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              <span>⚠️ 异常警报</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  anomaly.severity === 'CRITICAL' || anomaly.severity === 'HIGH'
                    ? 'bg-white/20'
                    : 'bg-yellow-400/30'
                }`}
              >
                {anomaly.severity === 'CRITICAL'
                  ? '紧急'
                  : anomaly.severity === 'HIGH'
                  ? '高'
                  : anomaly.severity === 'MEDIUM'
                  ? '中'
                  : '低'}
              </span>
            </div>
            <div className="text-xs mb-1 opacity-90">{anomaly.description}</div>
            <div className="text-[10px] opacity-70">
              {new Date(anomaly.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Road() {
  return (
    <group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 5]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={`dash-${i}`}
          position={[-38 + i * 4, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2, 0.15]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={`dash-2-${i}`}
          position={[-38 + i * 4, 0.01, 2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={`dash-3-${i}`}
          position={[-38 + i * 4, 0.01, -2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {[-18, -6, 6, 18].map((x, i) => (
        <group key={`bus-stop-${i}`} position={[x, 0, -5]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[3, 0.1, 1.5]} />
            <meshStandardMaterial color="#1e40af" />
          </mesh>
          <mesh position={[-1.4, 0.6, 0]} castShadow>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <mesh position={[1.4, 0.6, 0]} castShadow>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.3}
            color="#1e40af"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            车站 {i + 1}
          </Text>
        </group>
      ))}
      {[-20, -8, 4, 16].map((x, i) => (
        <mesh key={`tree-${i}`} position={[x, 0, 8]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      {[-20, -8, 4, 16].map((x, i) => (
        <mesh key={`leaves-${i}`} position={[x, 1.8, 8]} castShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      ))}
      {[-20, -8, 4, 16].map((x, i) => (
        <mesh key={`tree-b-${i}`} position={[x, 0, -8]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      {[-20, -8, 4, 16].map((x, i) => (
        <mesh key={`leaves-b-${i}`} position={[x, 1.8, -8]} castShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      ))}
    </group>
  );
}

function SceneContent({
  buses: busesProp,
  anomaly,
  showInternal = false,
  selectedBusId,
  onSelectBus,
}: BusSceneProps) {
  const buses = busesProp || DEFAULT_BUSES;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={['#87ceeb', '#3d7a3d', 0.4]} />

      <Road />

      {buses.map((bus, i) => (
        <BusModel
          key={bus.id}
          bus={bus}
          colorIndex={i}
          anomaly={anomaly}
          showInternal={showInternal}
          selected={selectedBusId === bus.id}
          onSelect={onSelectBus}
        />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={40}
        target={[0, 1, 0]}
      />
    </>
  );
}

export default function BusScene(props: BusSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [8, 6, 10], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#87ceeb']} />
        <fog attach="fog" args={['#bfdbfe', 30, 80]} />
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
