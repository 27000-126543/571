import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { AlertItem } from '../../../shared/types';

export interface CampusSceneProps {
  alerts?: AlertItem[];
  onSelectBuilding?: (buildingId: string) => void;
}

type BuildingId = 'A' | 'B' | 'library' | 'canteen' | 'admin';

interface BuildingConfig {
  id: BuildingId;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  floors: number;
  windowsPattern: [number, number];
}

const BUILDINGS: BuildingConfig[] = [
  {
    id: 'A',
    name: '教学楼A',
    position: [0, 7, 0],
    size: [16, 14, 10],
    color: '#0A2463',
    emissive: '#1e3a8a',
    emissiveIntensity: 0.15,
    floors: 4,
    windowsPattern: [8, 4],
  },
  {
    id: 'B',
    name: '教学楼B',
    position: [-22, 6, 0],
    size: [14, 12, 9],
    color: '#1e3a8a',
    emissive: '#3b82f6',
    emissiveIntensity: 0.1,
    floors: 4,
    windowsPattern: [7, 4],
  },
  {
    id: 'library',
    name: '图书馆',
    position: [0, 4, -22],
    size: [18, 8, 14],
    color: '#2EC4B6',
    emissive: '#14b8a6',
    emissiveIntensity: 0.1,
    floors: 3,
    windowsPattern: [9, 3],
  },
  {
    id: 'canteen',
    name: '食堂',
    position: [22, 3, 0],
    size: [16, 6, 12],
    color: '#FCA311',
    emissive: '#92400e',
    emissiveIntensity: 0.12,
    floors: 2,
    windowsPattern: [8, 2],
  },
  {
    id: 'admin',
    name: '行政楼',
    position: [22, 5, -22],
    size: [10, 10, 8],
    color: '#7c3aed',
    emissive: '#a78bfa',
    emissiveIntensity: 0.1,
    floors: 3,
    windowsPattern: [5, 3],
  },
];

const BUS_ROUTE_WAYPOINTS: [number, number, number][] = [
  [35, 1.25, 20],
  [35, 1.25, -15],
  [15, 1.25, -30],
  [-30, 1.25, -30],
  [-30, 1.25, 15],
  [-5, 1.25, 30],
  [25, 1.25, 30],
  [35, 1.25, 20],
];

function BuildingWindows({
  buildingSize,
  floors,
  pattern,
  position,
}: {
  buildingSize: [number, number, number];
  floors: number;
  pattern: [number, number];
  position: [number, number, number];
}) {
  const [winCols, winRows] = pattern;
  const totalWindows = winCols * 2 + (winRows - 2) * 2;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const windowSize = 0.6;

  useMemo(() => {
    if (!meshRef.current) return;
    const [w, h, d] = buildingSize;
    const floorHeight = h / floors;
    let idx = 0;

    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < winCols; c++) {
        for (let side = 0; side < 2; side++) {
          dummy.position.set(
            position[0] - w / 2 + (w / (winCols + 1)) * (c + 1),
            position[1] - h / 2 + floorHeight * (f + 0.5),
            position[2] + (side === 0 ? d / 2 + 0.02 : -d / 2 - 0.02)
          );
          dummy.scale.set(windowSize, windowSize * 0.8, 0.05);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(idx++, dummy.matrix);
        }
      }

      for (let r = 0; r < winRows - 2; r++) {
        for (let side = 0; side < 2; side++) {
          dummy.position.set(
            position[0] + (side === 0 ? w / 2 + 0.02 : -w / 2 - 0.02),
            position[1] - h / 2 + floorHeight * (f + 0.5),
            position[2] - d / 2 + (d / (winRows - 1)) * (r + 1)
          );
          dummy.scale.set(0.05, windowSize * 0.8, windowSize);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [buildingSize, floors, winCols, winRows, position, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalWindows]}>
      <boxGeometry />
      <meshStandardMaterial
        color="#fef3c7"
        emissive="#fbbf24"
        emissiveIntensity={0.6}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
}

function Building({
  config,
  isSelected,
  hasAlert,
  alertSeverity,
  onClick,
}: {
  config: BuildingConfig;
  isSelected: boolean;
  hasAlert: boolean;
  alertSeverity?: AlertItem['severity'];
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [emissivePulse, setEmissivePulse] = useState(config.emissiveIntensity || 0);

  useFrame((state) => {
    if (isSelected) {
      setEmissivePulse(
        0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.2 + (config.emissiveIntensity || 0)
      );
    } else if (hasAlert) {
      const base = 0.2 + (alertSeverity === 'CRITICAL' || alertSeverity === 'HIGH' ? 0.15 : 0.05);
      setEmissivePulse(base + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  const statusColor = useMemo(() => {
    if (hasAlert) {
      if (alertSeverity === 'CRITICAL' || alertSeverity === 'HIGH') return '#ef4444';
      return '#eab308';
    }
    return '#22c55e';
  }, [hasAlert, alertSeverity]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group position={config.position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={config.size} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive || config.color}
          emissiveIntensity={emissivePulse}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      <BuildingWindows
        buildingSize={config.size}
        floors={config.floors}
        pattern={config.windowsPattern}
        position={[0, 0, 0]}
      />

      <mesh position={[0, config.size[1] / 2 + 1.5, 0]} scale={[4, 1.2, 1]}>
        <planeGeometry />
        <meshStandardMaterial
          transparent
          opacity={0.95}
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Html
        position={[0, config.size[1] / 2 + 1.5, 0]}
        center
        distanceFactor={20}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(59,130,246,0.8)',
          whiteSpace: 'nowrap',
          padding: '4px 12px',
          background: 'rgba(10,36,99,0.7)',
          borderRadius: '4px',
          border: '1px solid rgba(59,130,246,0.5)',
        }}
      >
        {config.name}
      </Html>

      <mesh position={[0, -config.size[1] / 2 - 0.5, config.size[2] / 2 + 0.5]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={hasAlert ? 0.8 : 0.4}
        />
      </mesh>
    </group>
  );
}

function SchoolBus({
  index,
  startOffset,
}: {
  index: number;
  startOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [t, setT] = useState(startOffset);

  useFrame((_, delta) => {
    setT((prev) => (prev + delta * 0.015) % 1);
    if (!groupRef.current) return;

    const totalSegments = BUS_ROUTE_WAYPOINTS.length - 1;
    const positionOnPath = t * totalSegments;
    const segmentIndex = Math.floor(positionOnPath);
    const segmentT = positionOnPath - segmentIndex;

    const start = BUS_ROUTE_WAYPOINTS[segmentIndex];
    const end = BUS_ROUTE_WAYPOINTS[segmentIndex + 1];

    const x = start[0] + (end[0] - start[0]) * segmentT;
    const z = start[2] + (end[2] - start[2]) * segmentT;

    groupRef.current.position.set(x, 1.25, z);

    const dir = new THREE.Vector3(end[0] - start[0], 0, end[2] - start[2]).normalize();
    groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
  });

  const defaultPos: [number, number, number] = [35, 1.25, 10 + index * 6];

  return (
    <group ref={groupRef} position={defaultPos}>
      <mesh castShadow>
        <boxGeometry args={[5, 2.5, 2]} />
        <meshStandardMaterial color="#fde68a" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[5, 1.5, 2]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.15} />
      </mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((wx, i) => (
        <mesh key={i} position={[wx, 1.1, 1.01]}>
          <boxGeometry args={[0.7, 0.7, 0.05]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.7} />
        </mesh>
      ))}
      {[-1.8, 1.8].map((wx, i) => (
        <mesh key={`wheel-f-${i}`} position={[wx, -1, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
      {[-1.8, 1.8].map((wx, i) => (
        <mesh key={`wheel-b-${i}`} position={[wx, -1, -0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
      <Html
        position={[0, 2.5, 0]}
        center
        distanceFactor={15}
        style={{
          pointerEvents: 'none',
          color: '#78350f',
          fontSize: '11px',
          fontWeight: 'bold',
          background: 'rgba(253,224,71,0.9)',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid #d97706',
        }}
      >
        校车{String(index + 1).padStart(2, '0')}
      </Html>
    </group>
  );
}

function Playground() {
  return (
    <group position={[-22, 0.1, -20]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[8, 8, 0.2, 32]} />
        <meshStandardMaterial color="#16a34a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[8, 8, 0.25, 32, 1, true, 0, Math.PI * 2]} />
        <meshStandardMaterial color="#e5e7eb" side={THREE.DoubleSide} transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8.5, 1.2, 8, 64]} />
        <meshStandardMaterial color="#dc2626" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[4, 0.05, 8, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function SchoolGate() {
  return (
    <group position={[0, 3, 35]}>
      <mesh position={[-5, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 6, 0.8]} />
        <meshStandardMaterial color="#FCA311" emissive="#d97706" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[5, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 6, 0.8]} />
        <meshStandardMaterial color="#FCA311" emissive="#d97706" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[12, 0.6, 0.6]} />
        <meshStandardMaterial color="#FCA311" emissive="#d97706" emissiveIntensity={0.2} />
      </mesh>
      <Html
        position={[0, 3.8, 0.5]}
        center
        distanceFactor={15}
        style={{
          pointerEvents: 'none',
          color: '#fff7ed',
          fontSize: '20px',
          fontWeight: 'bold',
          letterSpacing: '8px',
          textShadow: '0 0 10px rgba(251,146,60,0.9)',
          padding: '6px 24px',
          background: 'rgba(194,65,12,0.6)',
          borderRadius: '4px',
        }}
      >
        智慧校园
      </Html>
    </group>
  );
}

function SceneContent({
  alerts,
  onSelectBuilding,
}: Required<Pick<CampusSceneProps, 'onSelectBuilding'>> & { alerts: AlertItem[] }) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(null);

  const buildingAlertMap = useMemo(() => {
    const map: Partial<Record<BuildingId, AlertItem>> = {};
    alerts.forEach((alert) => {
      if (alert.handled) return;
      const type = alert.type;
      let bid: BuildingId | undefined;
      if (type === 'CONFLICT') bid = 'A';
      else if (type === 'DEVICE_FAULT') bid = 'B';
      else if (type === 'STOCK_LOW') bid = 'canteen';
      else if (type === 'APPROVAL_TODO') bid = 'admin';
      else if (type === 'BUS_ANOMALY') return;
      if (bid && (!map[bid] || map[bid]!.severity !== 'CRITICAL')) {
        map[bid] = alert;
      }
    });
    return map;
  }, [alerts]);

  const handleBuildingClick = (id: BuildingId) => {
    setSelectedBuilding(id);
    onSelectBuilding(id);
  };

  return (
    <>
      <directionalLight
        position={[20, 30, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#60a5fa', '#1f2937', 0.5]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1f2e" roughness={0.8} />
      </mesh>

      <gridHelper args={[200, 40, '#30363D', '#1f2937']} position={[0, 0.01, 0]} />

      {BUILDINGS.map((cfg) => {
        const alert = buildingAlertMap[cfg.id];
        return (
          <Building
            key={cfg.id}
            config={cfg}
            isSelected={selectedBuilding === cfg.id}
            hasAlert={!!alert}
            alertSeverity={alert?.severity}
            onClick={() => handleBuildingClick(cfg.id)}
          />
        );
      })}

      {[0, 1, 2, 3, 4].map((i) => (
        <SchoolBus key={i} index={i} startOffset={i * 0.18} />
      ))}

      <Playground />
      <SchoolGate />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={15}
        maxDistance={100}
        target={[0, 5, 0]}
      />

      <EffectComposer>
        <Bloom intensity={0.4} luminanceThreshold={0.8} luminanceSmoothing={0.9} />
      </EffectComposer>
    </>
  );
}

export const CampusScene: React.FC<CampusSceneProps> = ({
  alerts = [],
  onSelectBuilding,
}) => {
  const safeOnSelectBuilding = onSelectBuilding || ((_: string) => {});
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <Canvas
      shadows
      camera={{ position: [40, 35, 40], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', background: '#0a0f1a' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0f1a');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <fog attach="fog" args={['#0a0f1a', 60, 150]} />
      <SceneContent alerts={safeAlerts} onSelectBuilding={safeOnSelectBuilding} />
    </Canvas>
  );
};

export default CampusScene;
