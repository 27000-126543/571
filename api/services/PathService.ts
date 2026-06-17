import type { NavPath } from '../../shared/types.js';

interface NavNode {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  description: string;
}

interface AStarNode {
  id: string;
  g: number;
  h: number;
  f: number;
  parent: string | null;
}

const NAV_NODES: NavNode[] = [
  { id: 'MAIN_GATE', name: '校门口', position: { x: 0, y: 0, z: -120 }, description: '学校正门入口' },
  { id: 'GATE_PLAZA', name: '校门广场', position: { x: 0, y: 0, z: -100 }, description: '校门入口广场' },
  { id: 'BUS_STATION', name: '校车点', position: { x: -30, y: 0, z: -110 }, description: '校车上车点' },
  { id: 'MAIN_ROAD_NORTH', name: '主干道北', position: { x: 0, y: 0, z: -60 }, description: '校园主干道北段' },
  { id: 'MAIN_ROAD_CENTER', name: '主干道中心', position: { x: 0, y: 0, z: -20 }, description: '校园中心道路' },
  { id: 'MAIN_ROAD_SOUTH', name: '主干道南', position: { x: 0, y: 0, z: 30 }, description: '校园主干道南段' },
  { id: 'TEACHING_A_ENTRANCE', name: '教学楼A入口', position: { x: -40, y: 0, z: -30 }, description: '教学楼A栋一层入口' },
  { id: 'TEACHING_A_F1_STAIRS', name: '教学楼A1楼楼梯', position: { x: -35, y: 0, z: -25 }, description: 'A栋1楼楼梯' },
  { id: 'TEACHING_A_F2_STAIRS', name: '教学楼A2楼楼梯', position: { x: -35, y: 3, z: -25 }, description: 'A栋2楼楼梯' },
  { id: 'TEACHING_A_F3_STAIRS', name: '教学楼A3楼楼梯', position: { x: -35, y: 6, z: -25 }, description: 'A栋3楼楼梯' },
  { id: 'TEACHING_A_F4_STAIRS', name: '教学楼A4楼楼梯', position: { x: -35, y: 9, z: -25 }, description: 'A栋4楼楼梯' },
  { id: 'TEACHING_A_F1_HALL', name: '教学楼A1楼大厅', position: { x: -45, y: 0, z: -20 }, description: 'A栋一层大厅' },
  { id: 'TEACHING_A_F2_HALL', name: '教学楼A2楼大厅', position: { x: -45, y: 3, z: -20 }, description: 'A栋二层大厅' },
  { id: 'TEACHING_A_F3_HALL', name: '教学楼A3楼大厅', position: { x: -45, y: 6, z: -20 }, description: 'A栋三层大厅' },
  { id: 'TEACHING_A_F4_HALL', name: '教学楼A4楼大厅', position: { x: -45, y: 9, z: -20 }, description: 'A栋四层大厅' },
  { id: 'TEACHING_B_ENTRANCE', name: '教学楼B入口', position: { x: 40, y: 0, z: -30 }, description: '教学楼B栋一层入口' },
  { id: 'TEACHING_B_F1_STAIRS', name: '教学楼B1楼楼梯', position: { x: 35, y: 0, z: -25 }, description: 'B栋1楼楼梯' },
  { id: 'TEACHING_B_F2_STAIRS', name: '教学楼B2楼楼梯', position: { x: 35, y: 3, z: -25 }, description: 'B栋2楼楼梯' },
  { id: 'TEACHING_B_F3_STAIRS', name: '教学楼B3楼楼梯', position: { x: 35, y: 6, z: -25 }, description: 'B栋3楼楼梯' },
  { id: 'TEACHING_B_F4_STAIRS', name: '教学楼B4楼楼梯', position: { x: 35, y: 9, z: -25 }, description: 'B栋4楼楼梯' },
  { id: 'LIBRARY_ENTRANCE', name: '图书馆入口', position: { x: 0, y: 0, z: 20 }, description: '图书馆正门' },
  { id: 'LIBRARY_F1_HALL', name: '图书馆1楼大厅', position: { x: 0, y: 0, z: 30 }, description: '图书馆一层大厅' },
  { id: 'LIBRARY_F1_STAIRS', name: '图书馆1楼楼梯', position: { x: 10, y: 0, z: 30 }, description: '图书馆楼梯1层' },
  { id: 'LIBRARY_F2_STAIRS', name: '图书馆2楼楼梯', position: { x: 10, y: 3, z: 30 }, description: '图书馆楼梯2层' },
  { id: 'LIBRARY_F2_ZONE_A', name: '图书馆A区', position: { x: -15, y: 3, z: 35 }, description: '安静阅读区' },
  { id: 'LIBRARY_F2_ZONE_B', name: '图书馆B区', position: { x: 5, y: 3, z: 35 }, description: '讨论区' },
  { id: 'LIBRARY_F2_ZONE_C', name: '图书馆C区', position: { x: 20, y: 3, z: 35 }, description: '电子阅览区' },
  { id: 'LIBRARY_F2_ZONE_D', name: '图书馆D区', position: { x: -5, y: 3, z: 45 }, description: '靠窗区' },
  { id: 'CANTEEN_ENTRANCE', name: '食堂入口', position: { x: 0, y: 0, z: 80 }, description: '食堂正门' },
  { id: 'CANTEEN_HALL', name: '食堂大厅', position: { x: 0, y: 0, z: 90 }, description: '食堂取餐大厅' },
  { id: 'CANTEEN_W1', name: '食堂1号窗口', position: { x: -20, y: 0, z: 95 }, description: '一号打饭窗口' },
  { id: 'CANTEEN_W2', name: '食堂2号窗口', position: { x: -10, y: 0, z: 95 }, description: '二号打饭窗口' },
  { id: 'CANTEEN_W3', name: '食堂3号窗口', position: { x: 0, y: 0, z: 95 }, description: '三号打饭窗口' },
  { id: 'CANTEEN_W4', name: '食堂4号窗口', position: { x: 10, y: 0, z: 95 }, description: '四号打饭窗口' },
  { id: 'CANTEEN_W5', name: '食堂5号窗口', position: { x: 20, y: 0, z: 95 }, description: '五号打饭窗口' },
  { id: 'CANTEEN_W6', name: '食堂6号窗口', position: { x: 30, y: 0, z: 95 }, description: '六号打饭窗口' },
  { id: 'ADMIN_BUILDING', name: '行政办公楼', position: { x: -60, y: 0, z: 30 }, description: '校长及行政办公室' },
  { id: 'DORMITORY_ENTRANCE', name: '宿舍区入口', position: { x: 60, y: 0, z: 50 }, description: '学生宿舍入口' },
  { id: 'PLAYGROUND', name: '操场', position: { x: 0, y: 0, z: 140 }, description: '主运动场' },
];

const CONNECTIONS: Record<string, string[]> = {};

function buildConnections(): void {
  for (const node of NAV_NODES) {
    CONNECTIONS[node.id] = [];
  }
  const addConnection = (a: string, b: string) => {
    if (!CONNECTIONS[a].includes(b)) CONNECTIONS[a].push(b);
    if (!CONNECTIONS[b].includes(a)) CONNECTIONS[b].push(a);
  };

  addConnection('MAIN_GATE', 'GATE_PLAZA');
  addConnection('GATE_PLAZA', 'BUS_STATION');
  addConnection('GATE_PLAZA', 'MAIN_ROAD_NORTH');

  addConnection('MAIN_ROAD_NORTH', 'MAIN_ROAD_CENTER');
  addConnection('MAIN_ROAD_CENTER', 'MAIN_ROAD_SOUTH');

  addConnection('MAIN_ROAD_NORTH', 'TEACHING_A_ENTRANCE');
  addConnection('MAIN_ROAD_NORTH', 'TEACHING_B_ENTRANCE');

  addConnection('TEACHING_A_ENTRANCE', 'TEACHING_A_F1_STAIRS');
  addConnection('TEACHING_A_ENTRANCE', 'TEACHING_A_F1_HALL');
  addConnection('TEACHING_A_F1_STAIRS', 'TEACHING_A_F2_STAIRS');
  addConnection('TEACHING_A_F2_STAIRS', 'TEACHING_A_F3_STAIRS');
  addConnection('TEACHING_A_F3_STAIRS', 'TEACHING_A_F4_STAIRS');
  addConnection('TEACHING_A_F1_STAIRS', 'TEACHING_A_F1_HALL');
  addConnection('TEACHING_A_F2_STAIRS', 'TEACHING_A_F2_HALL');
  addConnection('TEACHING_A_F3_STAIRS', 'TEACHING_A_F3_HALL');
  addConnection('TEACHING_A_F4_STAIRS', 'TEACHING_A_F4_HALL');

  addConnection('TEACHING_B_ENTRANCE', 'TEACHING_B_F1_STAIRS');
  addConnection('TEACHING_B_F1_STAIRS', 'TEACHING_B_F2_STAIRS');
  addConnection('TEACHING_B_F2_STAIRS', 'TEACHING_B_F3_STAIRS');
  addConnection('TEACHING_B_F3_STAIRS', 'TEACHING_B_F4_STAIRS');

  addConnection('MAIN_ROAD_CENTER', 'LIBRARY_ENTRANCE');
  addConnection('LIBRARY_ENTRANCE', 'LIBRARY_F1_HALL');
  addConnection('LIBRARY_F1_HALL', 'LIBRARY_F1_STAIRS');
  addConnection('LIBRARY_F1_STAIRS', 'LIBRARY_F2_STAIRS');
  addConnection('LIBRARY_F2_STAIRS', 'LIBRARY_F2_ZONE_A');
  addConnection('LIBRARY_F2_STAIRS', 'LIBRARY_F2_ZONE_B');
  addConnection('LIBRARY_F2_STAIRS', 'LIBRARY_F2_ZONE_C');
  addConnection('LIBRARY_F2_ZONE_A', 'LIBRARY_F2_ZONE_D');
  addConnection('LIBRARY_F2_ZONE_B', 'LIBRARY_F2_ZONE_D');

  addConnection('MAIN_ROAD_SOUTH', 'CANTEEN_ENTRANCE');
  addConnection('MAIN_ROAD_SOUTH', 'ADMIN_BUILDING');
  addConnection('MAIN_ROAD_SOUTH', 'DORMITORY_ENTRANCE');

  addConnection('CANTEEN_ENTRANCE', 'CANTEEN_HALL');
  addConnection('CANTEEN_HALL', 'CANTEEN_W1');
  addConnection('CANTEEN_HALL', 'CANTEEN_W2');
  addConnection('CANTEEN_HALL', 'CANTEEN_W3');
  addConnection('CANTEEN_HALL', 'CANTEEN_W4');
  addConnection('CANTEEN_HALL', 'CANTEEN_W5');
  addConnection('CANTEEN_HALL', 'CANTEEN_W6');

  addConnection('MAIN_ROAD_SOUTH', 'PLAYGROUND');
}

buildConnections();

function getNode(id: string): NavNode | undefined {
  return NAV_NODES.find((n) => n.id === id);
}

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

export class PathService {
  static getNavNodes(): NavNode[] {
    return NAV_NODES;
  }

  static findNodeByName(name: string): NavNode | undefined {
    return NAV_NODES.find(
      (n) => n.name === name || n.id === name || n.description.includes(name),
    );
  }

  static navigate(from: string, to: string): NavPath {
    let fromNode = getNode(from) || this.findNodeByName(from);
    let toNode = getNode(to) || this.findNodeByName(to);

    if (!fromNode) {
      fromNode = NAV_NODES[0];
    }
    if (!toNode) {
      toNode = NAV_NODES[NAV_NODES.length - 1];
    }

    if (fromNode.id === toNode.id) {
      return {
        from: fromNode.name,
        to: toNode.name,
        waypoints: [{ ...fromNode.position }],
        distance: 0,
        estimatedTime: 0,
      };
    }

    const result = this.aStar(fromNode.id, toNode.id);

    if (!result || result.length < 2) {
      const directPath = [fromNode, toNode];
      const waypoints = directPath.map((n) => ({ ...n.position }));
      const totalDist = distance(fromNode.position, toNode.position);
      return {
        from: fromNode.name,
        to: toNode.name,
        waypoints,
        distance: Math.round(totalDist * 10) / 10,
        estimatedTime: Math.ceil(totalDist / 80),
      };
    }

    const waypoints: { x: number; y: number; z: number }[] = [];
    let totalDist = 0;

    for (let i = 0; i < result.length; i++) {
      const node = getNode(result[i])!;
      waypoints.push({ ...node.position });
      if (i > 0) {
        const prev = getNode(result[i - 1])!;
        totalDist += distance(prev.position, node.position);
      }
    }

    const walkingSpeed = 80;
    const floorChangePenalty = 0.5;
    let floorChanges = 0;
    for (let i = 1; i < result.length; i++) {
      const a = getNode(result[i - 1])!;
      const b = getNode(result[i])!;
      if (Math.abs(a.position.y - b.position.y) > 2) {
        floorChanges++;
      }
    }

    const estimatedTime = Math.ceil(totalDist / walkingSpeed) + floorChanges * floorChangePenalty * 2;

    return {
      from: fromNode.name,
      to: toNode.name,
      waypoints,
      distance: Math.round(totalDist * 10) / 10,
      estimatedTime: Math.ceil(estimatedTime),
    };
  }

  private static aStar(startId: string, endId: string): string[] | null {
    const start = getNode(startId);
    const end = getNode(endId);
    if (!start || !end) return null;

    const openList = new Map<string, AStarNode>();
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();

    const h = (id: string): number => {
      const n = getNode(id)!;
      return distance(n.position, end.position);
    };

    openList.set(startId, {
      id: startId,
      g: 0,
      h: h(startId),
      f: h(startId),
      parent: null,
    });

    while (openList.size > 0) {
      let current: AStarNode | null = null;
      for (const node of openList.values()) {
        if (!current || node.f < current.f) {
          current = node;
        }
      }

      if (!current) break;

      if (current.id === endId) {
        const path: string[] = [];
        let nodeId: string | null = current.id;
        while (nodeId) {
          path.unshift(nodeId);
          nodeId = cameFrom.get(nodeId) || null;
        }
        return path;
      }

      openList.delete(current.id);
      closedSet.add(current.id);

      const neighbors = CONNECTIONS[current.id] || [];
      for (const neighborId of neighbors) {
        if (closedSet.has(neighborId)) continue;

        const currentNode = getNode(current.id)!;
        const neighborNode = getNode(neighborId);
        if (!neighborNode) continue;

        const moveCost = distance(currentNode.position, neighborNode.position);
        const tentativeG = current.g + moveCost;

        const existing = openList.get(neighborId);
        if (!existing || tentativeG < existing.g) {
          cameFrom.set(neighborId, current.id);
          openList.set(neighborId, {
            id: neighborId,
            g: tentativeG,
            h: h(neighborId),
            f: tentativeG + h(neighborId),
            parent: current.id,
          });
        }
      }
    }

    return null;
  }
}
