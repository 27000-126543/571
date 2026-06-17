import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line, Tube } from '@react-three/drei';
import { EffectComposer, Bloom, Outline, Selection, Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Classroom } from '../../../shared/types';

export interface TeachingSceneProps {
  classrooms?: Classroom[];
  selectedId?: string;
  onSelectClassroom?: (id: string) => void;
  pathWaypoints?: { x: number; y: number; z: number }[];
}

const BUILDING_LENGTH = 20;
const BUILDING_WIDTH = 12;
const FLOOR_HEIGHT = 3;
const TOTAL_FLOORS = 4;
const CLASSROOMS_PER_FLOOR = 6;

const CLASSROOM_WIDTH = BUILDING_LENGTH / CLASSROOMS_PER_FLOOR - 0.3;
const CLASSROOM_DEPTH = BUILDING_WIDTH * 0.75;
const CLASSROOM_HEIGHT = 2.5;

function CircularProgress({
  value,
  size = 60,
  strokeWidth = 6,
  color,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fill="#fff"
        fontSize="14"
        fontWeight="bold"
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}

function ClassroomHUDPanel({
  classroom,
  occupancy,
}: {
  classroom: Classroom;
  occupancy: number;
}) {
  const statusColor =
    occupancy > 90 ? '#ef4444' : occupancy > 70 ? '#eab308' : '#22c55e';

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: `1px solid ${statusColor}66`,
        borderRadius: '8px',
        padding: '12px 14px',
        minWidth: '200px',
        boxShadow: `0 0 20px ${statusColor}40`,
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '12px',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: statusColor }}>
        {classroom.roomNumber}
      </div>
      <div style={{ marginBottom: '10px', color: '#cbd5e1' }}>
        {classroom.currentCourse?.name || '暂无课程'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <CircularProgress value={occupancy} color={statusColor} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>座位占用率</div>
          <div style={{ fontWeight: 'bold', marginTop: '2px' }}>
            {classroom.occupiedSeats}/{classroom.capacity}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>温度 </span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
            {classroom.sensors.temperature.toFixed(1)}°C
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>湿度 </span>
          <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>
            {classroom.sensors.humidity.toFixed(0)}%
          </span>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <span style={{ color: '#64748b' }}>照度 </span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            {classroom.sensors.illuminance.toFixed(0)} lux
          </span>
        </div>
      </div>
    </div>
  );
}

function ClassroomRoom({
  classroom,
  floorIndex,
  classroomIndex,
  isSelected,
  isHovered,
  onSelect,
  onHoverChange,
}: {
  classroom: Classroom;
  floorIndex: number;
  classroomIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHoverChange: (v: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const doorRef = useRef<THREE.Mesh>(null);

  const occupancy = classroom.capacity > 0
    ? (classroom.occupiedSeats / classroom.capacity) * 100
    : 0;

  const statusColor = useMemo(() => {
    if (occupancy > 90) return '#ef4444';
    if (occupancy > 70) return '#eab308';
    return '#22c55e';
  }, [occupancy]);

  const xPos = -BUILDING_LENGTH / 2 + CLASSROOM_WIDTH / 2 + 0.15 + classroomIndex * (CLASSROOM_WIDTH + 0.3);
  const yPos = floorIndex * FLOOR_HEIGHT + CLASSROOM_HEIGHT / 2 + 0.15;
  const zPos = (BUILDING_WIDTH - CLASSROOM_DEPTH) / 2 - BUILDING_WIDTH / 2 + CLASSROOM_DEPTH / 2;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  };

  const deskRows = 4;
  const deskCols = 3;
  const desks: { x: number; y: number; z: number; isChair?: boolean }[] = [];
  for (let r = 0; r < deskRows; r++) {
    for (let c = 0; c < deskCols; c++) {
      const dx = -CLASSROOM_WIDTH / 2 + 0.8 + c * ((CLASSROOM_WIDTH - 1.6) / (deskCols - 1));
      const dz = -CLASSROOM_DEPTH / 2 + 1.5 + r * 0.8;
      desks.push({ x: dx, y: 0, z: dz });
      desks.push({ x: dx, y: 0, z: dz + 0.4, isChair: true });
    }
  }

  return (
    <group ref={groupRef} position={[xPos, yPos, zPos]}>
      <Select enabled={isSelected}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverChange(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            onHoverChange(false);
            document.body.style.cursor = 'default';
          }}
          castShadow
        >
          <boxGeometry args={[CLASSROOM_WIDTH, CLASSROOM_HEIGHT, CLASSROOM_DEPTH]} />
          <meshStandardMaterial
            color="#1e3a8a"
            emissive={isSelected ? '#3b82f6' : statusColor}
            emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0.08}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            roughness={0.5}
          />
        </mesh>
      </Select>

      {desks.map((d, i) => (
        <mesh
          key={i}
          position={[d.x, d.isChair ? 0.25 : 0.45, d.z]}
          castShadow
        >
          <boxGeometry args={d.isChair ? [0.3, 0.5, 0.3] : [0.6, 0.05, 0.45]} />
          <meshStandardMaterial
            color={d.isChair ? '#475569' : '#92400e'}
            roughness={0.8}
          />
        </mesh>
      ))}

      <mesh
        position={[0, CLASSROOM_HEIGHT / 2 - 0.2, -CLASSROOM_DEPTH / 2 + 0.05]}
        castShadow
      >
        <boxGeometry args={[CLASSROOM_WIDTH * 0.7, 1.2, 0.08]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.4}
        />
      </mesh>

      <mesh
        position={[0, 0.55, -CLASSROOM_DEPTH / 2 + 0.8]}
        castShadow
      >
        <boxGeometry args={[1.5, 1.1, 0.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh
        position={[0, 1.15, -CLASSROOM_DEPTH / 2 + 0.8]}
        castShadow
      >
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color="#92400e" roughness={0.6} />
      </mesh>

      <mesh
        ref={doorRef}
        position={[0, 0.8, CLASSROOM_DEPTH / 2 + 0.02]}
      >
        <boxGeometry args={[1.2, 1.6, 0.05]} />
        <meshStandardMaterial
          color="#334155"
          emissive="#fbbf24"
          emissiveIntensity={0.15}
          transparent
          opacity={0.6}
        />
      </mesh>

      <Line
        points={[
          [-CLASSROOM_WIDTH / 2, 0, CLASSROOM_DEPTH / 2 + 0.03],
          [-CLASSROOM_WIDTH / 2, 1.6, CLASSROOM_DEPTH / 2 + 0.03],
          [-CLASSROOM_WIDTH / 2 + 1.2, 1.6, CLASSROOM_DEPTH / 2 + 0.03],
          [-CLASSROOM_WIDTH / 2 + 1.2, 0, CLASSROOM_DEPTH / 2 + 0.03],
          [-CLASSROOM_WIDTH / 2, 0, CLASSROOM_DEPTH / 2 + 0.03],
        ]}
        color="#fbbf24"
        lineWidth={2}
      />

      <mesh position={[0, CLASSROOM_HEIGHT / 2 + 0.5, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      <Html
        position={[0, CLASSROOM_HEIGHT / 2 + 0.9, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(15,23,42,0.85)',
            border: `1px solid ${statusColor}80`,
            borderRadius: '4px',
            padding: '4px 10px',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            boxShadow: `0 0 8px ${statusColor}40`,
          }}
        >
          <div style={{ color: statusColor, marginBottom: '2px' }}>{classroom.roomNumber}</div>
          <div style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 'normal' }}>
            {classroom.currentCourse?.name || '空闲'}
          </div>
        </div>
      </Html>

      {isHovered && (
        <Html
          position={[CLASSROOM_WIDTH / 2 + 0.8, CLASSROOM_HEIGHT / 2 + 0.5, 0]}
          distanceFactor={8}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          <ClassroomHUDPanel classroom={classroom} occupancy={occupancy} />
        </Html>
      )}
    </group>
  );
}

function FloorSlab({ floorIndex }: { floorIndex: number }) {
  const y = floorIndex * FLOOR_HEIGHT;
  return (
    <mesh position={[0, y, 0]} receiveShadow castShadow>
      <boxGeometry args={[BUILDING_LENGTH, 0.3, BUILDING_WIDTH]} />
      <meshStandardMaterial
        color="#334155"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

function BuildingFrame() {
  return (
    <group>
      <Line
        points={[
          [-BUILDING_LENGTH / 2, 0, -BUILDING_WIDTH / 2],
          [-BUILDING_LENGTH / 2, TOTAL_FLOORS * FLOOR_HEIGHT, -BUILDING_WIDTH / 2],
          [BUILDING_LENGTH / 2, TOTAL_FLOORS * FLOOR_HEIGHT, -BUILDING_WIDTH / 2],
          [BUILDING_LENGTH / 2, 0, -BUILDING_WIDTH / 2],
          [-BUILDING_LENGTH / 2, 0, -BUILDING_WIDTH / 2],
        ]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.6}
      />
      <Line
        points={[
          [-BUILDING_LENGTH / 2, 0, BUILDING_WIDTH / 2],
          [-BUILDING_LENGTH / 2, TOTAL_FLOORS * FLOOR_HEIGHT, BUILDING_WIDTH / 2],
          [BUILDING_LENGTH / 2, TOTAL_FLOORS * FLOOR_HEIGHT, BUILDING_WIDTH / 2],
          [BUILDING_LENGTH / 2, 0, BUILDING_WIDTH / 2],
          [-BUILDING_LENGTH / 2, 0, BUILDING_WIDTH / 2],
        ]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.6}
      />
      <Line
        points={[
          [-BUILDING_LENGTH / 2, 0, -BUILDING_WIDTH / 2],
          [-BUILDING_LENGTH / 2, 0, BUILDING_WIDTH / 2],
        ]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.4}
      />
      <Line
        points={[
          [BUILDING_LENGTH / 2, 0, -BUILDING_WIDTH / 2],
          [BUILDING_LENGTH / 2, 0, BUILDING_WIDTH / 2],
        ]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.4}
      />
    </group>
  );
}

function PathTube({ waypoints }: { waypoints: { x: number; y: number; z: number }[] }) {
  const points = useMemo(() => {
    return waypoints.map(
      (wp) => new THREE.Vector3(wp.x, wp.y, wp.z)
    );
  }, [waypoints]);

  const curve = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [points]);

  if (!curve) return null;

  return (
    <Tube args={[curve, 200, 0.08, 16, false]}>
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={1.2}
        transparent
        opacity={0.85}
        toneMapped={false}
      />
    </Tube>
  );
}

function SceneContent({
  classrooms,
  selectedId,
  onSelectClassroom,
  pathWaypoints,
}: {
  classrooms: Classroom[];
  selectedId: string | undefined;
  onSelectClassroom: (id: string) => void;
  pathWaypoints: { x: number; y: number; z: number }[];
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.roomNumber.localeCompare(b.roomNumber);
    });
  }, [classrooms]);

  const classroomByFloor = useMemo(() => {
    const map: Record<number, Classroom[]> = {};
    for (let i = 0; i < TOTAL_FLOORS; i++) map[i] = [];
    sortedClassrooms.forEach((c) => {
      const floor = Math.min(Math.max(c.floor - 1, 0), TOTAL_FLOORS - 1);
      if (map[floor].length < CLASSROOMS_PER_FLOOR) {
        map[floor].push(c);
      }
    });
    return map;
  }, [sortedClassrooms]);

  return (
    <>
      <directionalLight
        position={[15, 20, 15]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#60a5fa', '#1f2937', 0.4]} />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#93c5fd" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      <gridHelper args={[60, 30, '#1e3a5f', '#0f172a']} position={[0, 0, 0]} />

      <BuildingFrame />

      {Array.from({ length: TOTAL_FLOORS + 1 }, (_, i) => (
        <FloorSlab key={`floor-${i}`} floorIndex={i} />
      ))}

      <Selection>
        <EffectComposer multisampling={8} autoClear={false}>
          <Outline
            visibleEdgeColor={0x3b82f6}
            hiddenEdgeColor={0x1d4ed8}
            edgeStrength={3}
            pulseSpeed={2}
            blur
            xRay={false}
          />
          <Bloom intensity={0.5} luminanceThreshold={0.7} luminanceSmoothing={0.9} />
        </EffectComposer>

        {Array.from({ length: TOTAL_FLOORS }, (_, floorIdx) =>
          Array.from({ length: CLASSROOMS_PER_FLOOR }, (_, classIdx) => {
            const classroom = classroomByFloor[floorIdx][classIdx];
            if (!classroom) {
              const xPos = -BUILDING_LENGTH / 2 + CLASSROOM_WIDTH / 2 + 0.15 + classIdx * (CLASSROOM_WIDTH + 0.3);
              const yPos = floorIdx * FLOOR_HEIGHT + CLASSROOM_HEIGHT / 2 + 0.15;
              const zPos = (BUILDING_WIDTH - CLASSROOM_DEPTH) / 2 - BUILDING_WIDTH / 2 + CLASSROOM_DEPTH / 2;
              return (
                <mesh
                  key={`empty-${floorIdx}-${classIdx}`}
                  position={[xPos, yPos, zPos]}
                >
                  <boxGeometry args={[CLASSROOM_WIDTH, CLASSROOM_HEIGHT, CLASSROOM_DEPTH]} />
                  <meshStandardMaterial
                    color="#1e293b"
                    transparent
                    opacity={0.15}
                    wireframe
                  />
                </mesh>
              );
            }
            return (
              <ClassroomRoom
                key={classroom.id}
                classroom={classroom}
                floorIndex={floorIdx}
                classroomIndex={classIdx}
                isSelected={selectedId === classroom.id}
                isHovered={hoveredId === classroom.id}
                onSelect={() => onSelectClassroom(classroom.id)}
                onHoverChange={(v) => setHoveredId(v ? classroom.id : null)}
              />
            );
          })
        )}
      </Selection>

      {pathWaypoints.length >= 2 && <PathTube waypoints={pathWaypoints} />}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={50}
        target={[0, 6, 0]}
      />
    </>
  );
}

export const TeachingScene: React.FC<TeachingSceneProps> = ({
  classrooms = [],
  selectedId,
  onSelectClassroom,
  pathWaypoints = [],
}) => {
  const safeClassrooms = Array.isArray(classrooms) ? classrooms : [];
  const safeOnSelect = onSelectClassroom || ((_: string) => {});
  const safeWaypoints = Array.isArray(pathWaypoints) ? pathWaypoints : [];

  return (
    <Canvas
      shadows
      camera={{ position: [15, 12, 15], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', background: '#0a0f1a' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0f1a');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      <fog attach="fog" args={['#0a0f1a', 30, 80]} />
      <SceneContent
        classrooms={safeClassrooms}
        selectedId={selectedId}
        onSelectClassroom={safeOnSelect}
        pathWaypoints={safeWaypoints}
      />
    </Canvas>
  );
};

export default TeachingScene;
