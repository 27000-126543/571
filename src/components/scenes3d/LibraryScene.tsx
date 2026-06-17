import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { LibrarySeat, SeatStatus } from '../../../shared/types';

export interface LibrarySceneProps {
  seats?: LibrarySeat[];
  highlightedIds?: string[];
  onSelectSeat?: (seat: LibrarySeat) => void;
}

const STATUS_COLORS: Record<SeatStatus, string> = {
  AVAILABLE: '#2EC4B6',
  RESERVED: '#FCA311',
  IN_USE: '#E63946',
  MAINTENANCE: '#6b7280',
};

function ReservedPulse({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      const intensity = 0.2 + 0.4 * (Math.sin(t * 2) * 0.5 + 0.5);
      groupRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            mat.emissiveIntensity = intensity;
          }
        }
      });
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

function HighlightedFloat({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

function SeatGroup({
  seat,
  isHighlighted,
  onSelect,
}: {
  seat: LibrarySeat;
  isHighlighted: boolean;
  onSelect?: (seat: LibrarySeat) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLORS[seat.status];
  const baseY = 0.35;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.(seat);
  };

  const seatContent = (
    <group
      position={[seat.position3D.x, baseY, seat.position3D.z]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 0.7]} />
        <meshStandardMaterial
          color={seat.status === 'MAINTENANCE' ? '#8b7355' : '#d4a574'}
          emissive={isHighlighted ? color : '#000000'}
          emissiveIntensity={isHighlighted ? 0.4 : 0}
        />
      </mesh>
      {[[-0.5, 0, -0.25], [0.5, 0, -0.25], [-0.5, 0, 0.25], [0.5, 0, 0.25]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 0, pos[2]]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#6b5344" />
        </mesh>
      ))}
      <mesh position={[0.8, -0.05, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={seat.status === 'RESERVED' ? color : isHighlighted ? color : '#000000'}
          emissiveIntensity={seat.status === 'RESERVED' ? 0.4 : isHighlighted ? 0.5 : 0}
        />
      </mesh>
      {hovered && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 shadow-2xl min-w-[160px] whitespace-nowrap">
            <div className="font-bold text-sm text-white">{seat.seatNumber}</div>
            <div className="text-xs text-gray-400 mt-1">{seat.zone}</div>
            {seat.currentStudentName && (
              <div className="text-xs text-warning mt-1">👤 {seat.currentStudentName}</div>
            )}
            <div
              className="text-xs mt-2 font-medium"
              style={{ color }}
            >
              {seat.status === 'AVAILABLE' && '空闲'}
              {seat.status === 'RESERVED' && '已预约'}
              {seat.status === 'IN_USE' && '使用中'}
              {seat.status === 'MAINTENANCE' && '维护中'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );

  let wrapped = seatContent;
  if (seat.status === 'RESERVED') {
    wrapped = <ReservedPulse>{wrapped}</ReservedPulse>;
  }
  if (isHighlighted) {
    wrapped = <HighlightedFloat>{wrapped}</HighlightedFloat>;
  }
  return wrapped;
}

function RoundTableSeats({
  seats,
  centerX,
  centerZ,
  highlightedIds,
  onSelect,
}: {
  seats: LibrarySeat[];
  centerX: number;
  centerZ: number;
  highlightedIds: string[];
  onSelect?: (seat: LibrarySeat) => void;
}) {
  const radius = 1.2;
  return (
    <group position={[centerX, 0, centerZ]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.1, 32]} />
        <meshStandardMaterial color="#c49a6c" />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 16]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>
      {seats.map((seat, i) => {
        const angle = (i / seats.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const color = STATUS_COLORS[seat.status];
        const isHighlighted = highlightedIds.includes(seat.id);
        return (
          <SeatGroupWithPos
            key={seat.id}
            seat={seat}
            position={[x, z]}
            rotation={-angle + Math.PI / 2}
            isHighlighted={isHighlighted}
            onSelect={onSelect}
            colorOverride={color}
          />
        );
      })}
    </group>
  );
}

function SeatGroupWithPos({
  seat,
  position,
  rotation,
  isHighlighted,
  onSelect,
  colorOverride,
}: {
  seat: LibrarySeat;
  position: [number, number];
  rotation: number;
  isHighlighted: boolean;
  onSelect?: (seat: LibrarySeat) => void;
  colorOverride: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={[position[0], 0.35, position[1]]}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(seat);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color={colorOverride}
          emissive={seat.status === 'RESERVED' || isHighlighted ? colorOverride : '#000000'}
          emissiveIntensity={seat.status === 'RESERVED' ? 0.3 : isHighlighted ? 0.5 : 0}
        />
      </mesh>
      {hovered && (
        <Html position={[0, 0.8, 0]} center distanceFactor={10}>
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 shadow-2xl whitespace-nowrap">
            <div className="font-bold text-sm text-white">{seat.seatNumber}</div>
            <div className="text-xs text-gray-400 mt-1">{seat.zone}</div>
            {seat.currentStudentName && (
              <div className="text-xs text-warning mt-1">👤 {seat.currentStudentName}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function ComputerSeat({
  seat,
  isHighlighted,
  onSelect,
}: {
  seat: LibrarySeat;
  isHighlighted: boolean;
  onSelect?: (seat: LibrarySeat) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLORS[seat.status];
  const baseY = 0.35;
  const monitorRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (monitorRef.current) {
      const mat = monitorRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + 0.2 * Math.sin(state.clock.elapsedTime * 3);
    }
  });

  return (
    <group
      position={[seat.position3D.x, baseY, seat.position3D.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(seat);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      {[[-0.6, 0, -0.3], [0.6, 0, -0.3], [-0.6, 0, 0.3], [0.6, 0, 0.3]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 0, pos[2]]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#6b5344" />
        </mesh>
      ))}
      <mesh ref={monitorRef} position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#1e293b" emissive="#60a5fa" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.55, -0.2]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.9, -0.05, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={seat.status === 'RESERVED' || isHighlighted ? color : '#000000'}
          emissiveIntensity={seat.status === 'RESERVED' ? 0.3 : isHighlighted ? 0.5 : 0}
        />
      </mesh>
      {hovered && (
        <Html position={[0, 1.5, 0]} center distanceFactor={10}>
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 shadow-2xl min-w-[160px] whitespace-nowrap">
            <div className="font-bold text-sm text-white">{seat.seatNumber}</div>
            <div className="text-xs text-gray-400 mt-1">{seat.zone}</div>
            <div className="text-xs text-primary-300 mt-1">💻 配电脑</div>
            {seat.currentStudentName && (
              <div className="text-xs text-warning mt-1">👤 {seat.currentStudentName}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function WindowSeat({
  seat,
  isHighlighted,
  onSelect,
}: {
  seat: LibrarySeat;
  isHighlighted: boolean;
  onSelect?: (seat: LibrarySeat) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLORS[seat.status];
  const baseY = 0.35;

  return (
    <group
      position={[seat.position3D.x, baseY, seat.position3D.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(seat);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.0, 0.1, 0.6]} />
        <meshStandardMaterial color="#e8c9a0" />
      </mesh>
      {[[-0.4, 0, -0.2], [0.4, 0, -0.2], [-0.4, 0, 0.2], [0.4, 0, 0.2]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 0, pos[2]]} castShadow>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color="#8b6f47" />
        </mesh>
      ))}
      <mesh position={[0.6, -0.05, 0]} castShadow>
        <boxGeometry args={[0.38, 0.4, 0.38]} />
        <meshStandardMaterial
          color={color}
          emissive={seat.status === 'RESERVED' || isHighlighted ? color : '#000000'}
          emissiveIntensity={seat.status === 'RESERVED' ? 0.3 : isHighlighted ? 0.5 : 0}
        />
      </mesh>
      {hovered && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 shadow-2xl min-w-[160px] whitespace-nowrap">
            <div className="font-bold text-sm text-white">{seat.seatNumber}</div>
            <div className="text-xs text-gray-400 mt-1">{seat.zone}</div>
            <div className="text-xs text-success mt-1">🌿 靠窗景观位</div>
            {seat.currentStudentName && (
              <div className="text-xs text-warning mt-1">👤 {seat.currentStudentName}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function Bookshelf({ position, count = 1 }: { position: [number, number, number]; count?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <group key={i} position={[i * 1.05, 0, 0]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1, 2, 0.4]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
          {[0.4, 0.9, 1.4].map((y, j) => (
            <mesh key={j} position={[0, y, 0.05]}>
              <boxGeometry args={[0.9, 0.05, 0.35]} />
              <meshStandardMaterial color="#a0522d" />
            </mesh>
          ))}
          {[0.15, 0.65, 1.15, 1.65].map((y, j) => (
            <mesh key={`book-${j}`} position={[-0.2 + (j % 2) * 0.3, y, 0.08]}>
              <boxGeometry args={[0.15, 0.3, 0.2]} />
              <meshStandardMaterial color={['#e63946', '#2EC4B6', '#FCA311', '#1d4ed8'][j % 4]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function LibraryRoom() {
  const wallThickness = 0.2;
  const width = 24;
  const height = 6;
  const depth = 18;
  const glassOpacity = 0.3;

  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5e6d3" />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2]}>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={glassOpacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]}>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={glassOpacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={glassOpacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={glassOpacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width, wallThickness, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[-8, 0, 8].map((x, i) => (
        <mesh key={`ceiling-light-${i}`} position={[x, height - 0.15, -5]}>
          <pointLight intensity={0.8} distance={10} color="#fff5e1" />
        </mesh>
      ))}
      {[-8, 0, 8].map((x, i) => (
        <mesh key={`ceiling-light-2-${i}`} position={[x, height - 0.15, 5]}>
          <pointLight intensity={0.8} distance={10} color="#fff5e1" />
        </mesh>
      ))}
    </group>
  );
}

function ServiceDesk() {
  return (
    <group position={[-2, 0, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[4, 1.1, 1.5]} />
        <meshStandardMaterial color="#5d4e37" />
      </mesh>
      <mesh position={[2.25, 0.55, -1.75]} castShadow>
        <boxGeometry args={[0.5, 1.1, 2]} />
        <meshStandardMaterial color="#5d4e37" />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[3.8, 0.05, 1.3]} />
        <meshStandardMaterial color="#8b6f47" />
      </mesh>
    </group>
  );
}

function WindowRow() {
  return (
    <group>
      {[-6, -2, 2, 6].map((z, i) => (
        <mesh key={`window-${i}`} position={[-11.85, 3, z]}>
          <boxGeometry args={[0.1, 2, 2.5]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} emissive="#87ceeb" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function ZoneLabel({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Text
      position={position}
      fontSize={0.5}
      color="#FCA311"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}

function generateDefaultSeats(): LibrarySeat[] {
  const seats: LibrarySeat[] = [];
  const statuses: SeatStatus[] = ['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE'];
  const studentNames = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];

  let idx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const seed = (r * 7 + c * 13) % 10;
      let status: SeatStatus;
      if (seed < 5) status = 'AVAILABLE';
      else if (seed < 7) status = 'IN_USE';
      else if (seed < 9) status = 'RESERVED';
      else status = 'MAINTENANCE';

      seats.push({
        id: `A-${r}-${c}`,
        seatNumber: `A${String(r * 4 + c + 1).padStart(3, '0')}`,
        zone: 'A安静区',
        status,
        position3D: { x: -8 + c * 2, y: 0, z: -6 + r * 2.2 },
        usedMinutesToday: Math.floor(Math.random() * 300),
        ...(status === 'RESERVED' && {
          currentStudentName: studentNames[idx % studentNames.length],
        }),
        ...(status === 'IN_USE' && {
          currentStudentName: studentNames[(idx + 3) % studentNames.length],
        }),
      });
      idx++;
    }
  }

  const roundTables = [
    { cx: 4, cz: -5 },
    { cx: 7, cz: -5 },
    { cx: 4, cz: -1 },
    { cx: 7, cz: -1 },
  ];
  roundTables.forEach((table, ti) => {
    for (let i = 0; i < 4; i++) {
      const seed = (ti * 11 + i * 5) % 10;
      let status: SeatStatus;
      if (seed < 4) status = 'AVAILABLE';
      else if (seed < 7) status = 'IN_USE';
      else if (seed < 9) status = 'RESERVED';
      else status = 'MAINTENANCE';
      seats.push({
        id: `B-${ti}-${i}`,
        seatNumber: `B${String(ti * 4 + i + 1).padStart(3, '0')}`,
        zone: 'B讨论区',
        status,
        position3D: { x: table.cx, y: 0, z: table.cz },
        usedMinutesToday: Math.floor(Math.random() * 200),
        ...(status === 'IN_USE' && {
          currentStudentName: studentNames[(ti + i) % studentNames.length],
        }),
      });
    }
  });

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const seed = (r * 17 + c * 19 + 3) % 10;
      let status: SeatStatus;
      if (seed < 4) status = 'AVAILABLE';
      else if (seed < 7) status = 'IN_USE';
      else if (seed < 9) status = 'RESERVED';
      else status = 'MAINTENANCE';
      seats.push({
        id: `C-${r}-${c}`,
        seatNumber: `C${String(r * 4 + c + 1).padStart(3, '0')}`,
        zone: 'C电子阅览区',
        status,
        position3D: { x: 3 + c * 2.2, y: 0, z: 3 + r * 2.2 },
        usedMinutesToday: Math.floor(Math.random() * 350),
        ...(status === 'IN_USE' && {
          currentStudentName: studentNames[(r + c + 2) % studentNames.length],
        }),
        ...(status === 'RESERVED' && {
          currentStudentName: studentNames[(r + c + 5) % studentNames.length],
        }),
      });
    }
  }

  for (let i = 0; i < 8; i++) {
    const seed = (i * 23 + 7) % 10;
    let status: SeatStatus;
    if (seed < 5) status = 'AVAILABLE';
    else if (seed < 7) status = 'IN_USE';
    else if (seed < 9) status = 'RESERVED';
    else status = 'MAINTENANCE';
    seats.push({
      id: `D-${i}`,
      seatNumber: `D${String(i + 1).padStart(3, '0')}`,
      zone: 'D靠窗区',
      status,
      position3D: { x: -9.5, y: 0, z: -7 + i * 2 },
      usedMinutesToday: Math.floor(Math.random() * 250),
      ...(status === 'IN_USE' && {
        currentStudentName: studentNames[(i + 1) % studentNames.length],
      }),
    });
  }

  return seats;
}

function SceneContent({ seats, highlightedIds = [], onSelectSeat }: LibrarySceneProps) {
  const displaySeats = seats || generateDefaultSeats();
  const hlSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);

  const zoneASeats = displaySeats.filter((s) => s.zone === 'A安静区');
  const zoneBSeats = displaySeats.filter((s) => s.zone === 'B讨论区');
  const zoneCSeats = displaySeats.filter((s) => s.zone === 'C电子阅览区');
  const zoneDSeats = displaySeats.filter((s) => s.zone === 'D靠窗区');

  const bTableGroups = useMemo(() => {
    const groups: LibrarySeat[][] = [];
    for (let i = 0; i < zoneBSeats.length; i += 4) {
      groups.push(zoneBSeats.slice(i, i + 4));
    }
    return groups;
  }, [zoneBSeats]);

  const roundTableCenters = [
    { cx: 4, cz: -5 },
    { cx: 7, cz: -5 },
    { cx: 4, cz: -1 },
    { cx: 7, cz: -1 },
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <LibraryRoom />
      <WindowRow />
      <ServiceDesk />

      <Bookshelf position={[-8, 0, -8.5]} count={6} />
      <Bookshelf position={[-2, 0, -8.5]} count={6} />
      <Bookshelf position={[5, 0, -8.5]} count={6} />
      <Bookshelf position={[10.5, 0, -5]} count={1} />
      <Bookshelf position={[10.5, 0, -1]} count={1} />
      <Bookshelf position={[10.5, 0, 3]} count={1} />
      <Bookshelf position={[10.5, 0, 7]} count={1} />
      <Bookshelf position={[-8, 0, 8.5]} count={6} />
      <Bookshelf position={[-2, 0, 8.5]} count={6} />
      <Bookshelf position={[5, 0, 8.5]} count={6} />

      <ZoneLabel text="A 安静区" position={[-5, 5.5, -6]} />
      <ZoneLabel text="B 讨论区" position={[5.5, 5.5, -3]} />
      <ZoneLabel text="C 电子阅览区" position={[6.5, 5.5, 7]} />
      <ZoneLabel text="D 靠窗区" position={[-9.5, 5.5, 0]} />
      <ZoneLabel text="服务台" position={[-2, 5.5, 2]} />

      {zoneASeats.map((seat) => (
        <SeatGroup
          key={seat.id}
          seat={seat}
          isHighlighted={hlSet.has(seat.id)}
          onSelect={onSelectSeat}
        />
      ))}

      {bTableGroups.map((group, gi) => {
        const center = roundTableCenters[gi] || { cx: 0, cz: 0 };
        return (
          <RoundTableSeats
            key={`table-${gi}`}
            seats={group}
            centerX={center.cx}
            centerZ={center.cz}
            highlightedIds={highlightedIds}
            onSelect={onSelectSeat}
          />
        );
      })}

      {zoneCSeats.map((seat) => (
        <ComputerSeat
          key={seat.id}
          seat={seat}
          isHighlighted={hlSet.has(seat.id)}
          onSelect={onSelectSeat}
        />
      ))}

      {zoneDSeats.map((seat) => (
        <WindowSeat
          key={seat.id}
          seat={seat}
          isHighlighted={hlSet.has(seat.id)}
          onSelect={onSelectSeat}
        />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={35}
        target={[0, 1, 0]}
      />
    </>
  );
}

export default function LibraryScene(props: LibrarySceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [12, 10, 12], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 25, 50]} />
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
