import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import type {
  User,
  Classroom,
  Course,
  LibrarySeat,
  Dish,
  InventoryItem,
  PurchaseOrder,
  Bus,
  BusAnomaly,
  Visitor,
  Device,
  WorkOrder,
  OperationLog,
  Reservation,
  ScheduleConflict,
  UserRole,
  EquipmentType,
  DeviceType,
  ApprovalStatus,
} from '../../shared/types.js';

const id = (prefix: string, n: number | string) => `${prefix}_${n}`;

const gradeNames = ['初一', '初二', '初三', '高一', '高二', '高三'];
const gradeToNum = (g: string) => (g.startsWith('初') ? 6 + parseInt(g[1]) : 9 + parseInt(g[1]));

function genUsers(): User[] {
  const users: User[] = [];
  const passwordHash = bcrypt.hashSync('123456', 10);
  const now = dayjs().toISOString();

  users.push({
    id: id('u', 'admin'),
    username: 'admin',
    name: '系统管理员',
    role: 'principal',
    passwordHash,
    avatar: '',
    createdAt: now,
  });

  users.push({
    id: id('u', 'logistics'),
    username: 'logistics',
    name: '王后勤',
    role: 'logistics_director',
    passwordHash,
    employeeId: 'L001',
    phone: '13800138001',
    createdAt: now,
  });

  users.push({
    id: id('u', 'moral'),
    username: 'moral',
    name: '李德育',
    role: 'moral_director',
    passwordHash,
    employeeId: 'M001',
    phone: '13800138002',
    createdAt: now,
  });

  const teacherNames = ['张老师', '王老师', '李老师', '赵老师', '刘老师', '陈老师', '杨老师', '黄老师', '周老师', '吴老师', '郑老师', '孙老师'];
  teacherNames.forEach((name, i) => {
    users.push({
      id: id('u', `t${i + 1}`),
      username: `teacher${i + 1}`,
      name,
      role: i < 6 ? 'head_teacher' : 'teacher',
      passwordHash,
      employeeId: `T${String(i + 1).padStart(3, '0')}`,
      phone: `139${String(10000000 + i).padStart(8, '0')}`,
      createdAt: now,
    });
  });

  for (let g = 0; g < 6; g++) {
    for (let c = 1; c <= 2; c++) {
      for (let s = 1; s <= 12; s++) {
        const num = g * 24 + (c - 1) * 12 + s;
        const grade = 7 + g;
        users.push({
          id: id('u', `s${num}`),
          username: `stu_${grade}_${c}_${s}`,
          name: `${gradeNames[g]}${c}班${String(s).padStart(2, '0')}号`,
          role: 'student',
          passwordHash,
          grade,
          classId: id('cls', `${grade}_${c}`),
          phone: `137${String(20000000 + num).padStart(8, '0')}`,
          createdAt: now,
        });
      }
    }
  }

  for (let p = 1; p <= 10; p++) {
    users.push({
      id: id('u', `p${p}`),
      username: `parent${p}`,
      name: `家长${p}`,
      role: 'parent',
      passwordHash,
      phone: `136${String(30000000 + p).padStart(8, '0')}`,
      createdAt: now,
    });
  }

  return users;
}

function genClassrooms(): Classroom[] {
  const rooms: Classroom[] = [];
  const buildings: Record<string, EquipmentType[][]> = {
    A: [
      ['projector', 'blackboard', 'computer'],
      ['projector', 'blackboard', 'computer'],
      ['projector', 'blackboard', 'computer'],
      ['projector', 'blackboard', 'computer'],
      ['projector', 'blackboard', 'computer', 'lab'],
      ['projector', 'blackboard', 'computer'],
    ],
    B: [
      ['projector', 'blackboard', 'computer'],
      ['projector', 'blackboard', 'computer', 'lab'],
      ['projector', 'blackboard', 'computer', 'music'],
      ['projector', 'blackboard', 'computer', 'art'],
      ['projector', 'blackboard', 'computer'],
      ['projector', 'blackboard', 'computer'],
    ],
  };
  for (const [bid, floors] of Object.entries(buildings)) {
    for (let f = 1; f <= 4; f++) {
      for (let r = 1; r <= 6; r++) {
        const idx = (f - 1) * 6 + (r - 1);
        const equip = floors[idx % floors.length];
        const isLab = equip.includes('lab') || equip.includes('music') || equip.includes('art');
        rooms.push({
          id: id('rm', `${bid}${f}${String(r).padStart(2, '0')}`),
          buildingId: bid,
          floor: f,
          roomNumber: `${bid}${f}${String(r).padStart(2, '0')}`,
          capacity: isLab ? 40 : 50,
          occupiedSeats: 0,
          equipment: equip,
          sensors: {
            temperature: 22 + Math.random() * 4,
            humidity: 45 + Math.random() * 15,
            illuminance: 300 + Math.random() * 500,
          },
          position3D: { x: (bid === 'A' ? -10 : 10) + r * 2, y: f * 3, z: (f - 1) * 10, floorHeight: 3 },
        });
      }
    }
  }
  return rooms;
}

function genCourses(users: User[], classrooms: Classroom[]): Course[] {
  const courses: Course[] = [];
  const teachers = users.filter((u) => u.role === 'teacher' || u.role === 'head_teacher');
  const subjects = [
    { name: '语文', equip: [] as EquipmentType[] },
    { name: '数学', equip: [] as EquipmentType[] },
    { name: '英语', equip: [] as EquipmentType[] },
    { name: '物理', equip: ['lab'] as EquipmentType[] },
    { name: '化学', equip: ['lab'] as EquipmentType[] },
    { name: '生物', equip: ['lab'] as EquipmentType[] },
    { name: '音乐', equip: ['music'] as EquipmentType[] },
    { name: '美术', equip: ['art'] as EquipmentType[] },
    { name: '信息技术', equip: ['computer'] as EquipmentType[] },
    { name: '体育', equip: [] as EquipmentType[] },
  ];
  const timeSlots = ['08:00-08:45', '09:00-09:45', '10:00-10:45', '11:00-11:45', '14:00-14:45', '15:00-15:45', '16:00-16:45'];

  let courseId = 1;
  for (let grade = 7; grade <= 12; grade++) {
    for (let classNum = 1; classNum <= 2; classNum++) {
      const classId = id('cls', `${grade}_${classNum}`);
      for (let wd = 1 as 1 | 2 | 3 | 4 | 5; wd <= 5; wd++) {
        for (let t = 0; t < 5; t++) {
          const subj = subjects[(wd + t + grade) % subjects.length];
          const teacher = teachers[(courseId + grade) % teachers.length];
          const [st, et] = timeSlots[t].split('-');
          courses.push({
            id: id('c', courseId++),
            name: subj.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            grade,
            classId,
            startTime: st,
            endTime: et,
            weekday: wd,
            requiredEquipment: subj.equip,
            priority: grade + (wd === 1 || wd === 2 ? 0.5 : 0),
          });
        }
      }
    }
  }
  return courses;
}

function genSeats(): LibrarySeat[] {
  const seats: LibrarySeat[] = [];
  const zones: LibrarySeat['zone'][] = ['A安静区', 'B讨论区', 'C电子阅览区', 'D靠窗区'];
  for (let z = 0; z < 4; z++) {
    for (let n = 1; n <= 20; n++) {
      seats.push({
        id: id('seat', `${zones[z][0]}${String(n).padStart(3, '0')}`),
        seatNumber: `${zones[z][0]}${String(n).padStart(3, '0')}`,
        zone: zones[z],
        status: Math.random() < 0.7 ? 'AVAILABLE' : Math.random() < 0.5 ? 'RESERVED' : 'IN_USE',
        position3D: { x: z * 15 + (n % 5) * 2, y: 0, z: Math.floor(n / 5) * 2 },
        usedMinutesToday: Math.floor(Math.random() * 300),
      });
    }
  }
  return seats;
}

function genDishes(): Dish[] {
  const dishes: Dish[] = [];
  const windows = [
    { id: 'w1', name: '一号窗口' },
    { id: 'w2', name: '二号窗口' },
    { id: 'w3', name: '三号窗口' },
    { id: 'w4', name: '四号窗口' },
    { id: 'w5', name: '五号窗口' },
    { id: 'w6', name: '六号窗口' },
  ];
  const categories: Dish['category'][] = ['主食', '热菜', '热菜', '凉菜', '汤羹', '饮品'];
  const dishPool = [
    '红烧肉', '宫保鸡丁', '鱼香肉丝', '糖醋里脊', '麻婆豆腐',
    '西红柿鸡蛋', '青椒土豆丝', '红烧肉', '蒜蓉西兰花', '红烧茄子',
    '白米饭', '馒头', '面条', '蛋炒饭', '牛肉面',
    '凉拌黄瓜', '口水鸡', '花生米', '拍黄瓜', '凉拌木耳',
    '鸡蛋汤', '紫菜蛋花汤', '小米粥', '南瓜粥', '豆腐脑',
    '可乐', '雪碧', '橙汁', '酸奶', '豆浆',
  ];
  let did = 1;
  windows.forEach((w, wi) => {
    for (let d = 0; d < 5; d++) {
      const name = dishPool[wi * 5 + d];
      const cat = categories[Math.min(Math.floor(d / 1), categories.length - 1)];
      const price = cat === '主食' ? 2 + Math.random() * 4 : cat === '饮品' ? 3 + Math.random() * 3 : 8 + Math.random() * 15;
      dishes.push({
        id: id('dish', did++),
        name,
        windowId: w.id,
        windowName: w.name,
        category: cat,
        price: Math.round(price * 10) / 10,
        nutrition: {
          calories: Math.round(150 + Math.random() * 400),
          protein: Math.round(5 + Math.random() * 25),
          fat: Math.round(3 + Math.random() * 20),
          carbohydrate: Math.round(20 + Math.random() * 60),
          sodium: Math.round(200 + Math.random() * 800),
        },
        ingredients: name.split('').filter((_, i) => i < 3),
        soldToday: Math.floor(Math.random() * 200),
        remainingServings: Math.floor(Math.random() * 150) + 10,
        position3D: { x: wi * 5, y: 0, z: d * 2 },
      });
    }
  });
  return dishes;
}

function genInventory(): InventoryItem[] {
  const items: Omit<InventoryItem, 'id'>[] = [
    { name: '大白菜', category: '蔬菜', unit: 'kg', currentStock: 50, safetyThreshold: 30, dailyConsumption: 10, lastPurchasedAt: dayjs().subtract(2, 'day').toISOString(), supplierName: '新发地蔬菜', status: 'NORMAL' },
    { name: '土豆', category: '蔬菜', unit: 'kg', currentStock: 80, safetyThreshold: 40, dailyConsumption: 15, lastPurchasedAt: dayjs().subtract(3, 'day').toISOString(), supplierName: '新发地蔬菜', status: 'NORMAL' },
    { name: '西红柿', category: '蔬菜', unit: 'kg', currentStock: 15, safetyThreshold: 25, dailyConsumption: 8, lastPurchasedAt: dayjs().subtract(4, 'day').toISOString(), supplierName: '新发地蔬菜', status: 'WARNING' },
    { name: '黄瓜', category: '蔬菜', unit: 'kg', currentStock: 5, safetyThreshold: 20, dailyConsumption: 6, lastPurchasedAt: dayjs().subtract(5, 'day').toISOString(), supplierName: '新发地蔬菜', status: 'CRITICAL' },
    { name: '青椒', category: '蔬菜', unit: 'kg', currentStock: 22, safetyThreshold: 18, dailyConsumption: 5, lastPurchasedAt: dayjs().subtract(2, 'day').toISOString(), supplierName: '新发地蔬菜', status: 'NORMAL' },
    { name: '五花肉', category: '肉类', unit: 'kg', currentStock: 25, safetyThreshold: 20, dailyConsumption: 8, lastPurchasedAt: dayjs().subtract(1, 'day').toISOString(), supplierName: '双汇冷鲜肉', status: 'NORMAL' },
    { name: '鸡胸肉', category: '肉类', unit: 'kg', currentStock: 12, safetyThreshold: 25, dailyConsumption: 7, lastPurchasedAt: dayjs().subtract(3, 'day').toISOString(), supplierName: '圣农鸡肉', status: 'WARNING' },
    { name: '猪里脊', category: '肉类', unit: 'kg', currentStock: 8, safetyThreshold: 15, dailyConsumption: 5, lastPurchasedAt: dayjs().subtract(4, 'day').toISOString(), supplierName: '双汇冷鲜肉', status: 'WARNING' },
    { name: '牛肉', category: '肉类', unit: 'kg', currentStock: 3, safetyThreshold: 10, dailyConsumption: 3, lastPurchasedAt: dayjs().subtract(6, 'day').toISOString(), supplierName: '皓月牛肉', status: 'CRITICAL' },
    { name: '鸡蛋', category: '肉类', unit: 'kg', currentStock: 30, safetyThreshold: 25, dailyConsumption: 10, lastPurchasedAt: dayjs().subtract(2, 'day').toISOString(), supplierName: '德青源鸡蛋', status: 'NORMAL' },
    { name: '大米', category: '米面', unit: 'kg', currentStock: 200, safetyThreshold: 100, dailyConsumption: 40, lastPurchasedAt: dayjs().subtract(5, 'day').toISOString(), supplierName: '五常大米', status: 'NORMAL' },
    { name: '面粉', category: '米面', unit: 'kg', currentStock: 80, safetyThreshold: 50, dailyConsumption: 15, lastPurchasedAt: dayjs().subtract(4, 'day').toISOString(), supplierName: '河套面粉', status: 'NORMAL' },
    { name: '挂面', category: '米面', unit: 'kg', currentStock: 18, safetyThreshold: 20, dailyConsumption: 4, lastPurchasedAt: dayjs().subtract(7, 'day').toISOString(), supplierName: '金沙河', status: 'WARNING' },
    { name: '食用油', category: '油料', unit: 'L', currentStock: 40, safetyThreshold: 30, dailyConsumption: 8, lastPurchasedAt: dayjs().subtract(3, 'day').toISOString(), supplierName: '金龙鱼', status: 'NORMAL' },
    { name: '花生油', category: '油料', unit: 'L', currentStock: 25, safetyThreshold: 20, dailyConsumption: 5, lastPurchasedAt: dayjs().subtract(2, 'day').toISOString(), supplierName: '鲁花', status: 'NORMAL' },
    { name: '老抽', category: '调料', unit: '瓶', currentStock: 5, safetyThreshold: 10, dailyConsumption: 1, lastPurchasedAt: dayjs().subtract(10, 'day').toISOString(), supplierName: '海天', status: 'CRITICAL' },
    { name: '生抽', category: '调料', unit: '瓶', currentStock: 8, safetyThreshold: 8, dailyConsumption: 1, lastPurchasedAt: dayjs().subtract(8, 'day').toISOString(), supplierName: '海天', status: 'NORMAL' },
    { name: '盐', category: '调料', unit: 'kg', currentStock: 15, safetyThreshold: 10, dailyConsumption: 2, lastPurchasedAt: dayjs().subtract(5, 'day').toISOString(), supplierName: '中盐', status: 'NORMAL' },
    { name: '白糖', category: '调料', unit: 'kg', currentStock: 12, safetyThreshold: 8, dailyConsumption: 1, lastPurchasedAt: dayjs().subtract(4, 'day').toISOString(), supplierName: '太古', status: 'NORMAL' },
    { name: '冻鸡腿', category: '冻品', unit: 'kg', currentStock: 18, safetyThreshold: 20, dailyConsumption: 6, lastPurchasedAt: dayjs().subtract(5, 'day').toISOString(), supplierName: '正大食品', status: 'WARNING' },
    { name: '冻虾仁', category: '冻品', unit: 'kg', currentStock: 2, safetyThreshold: 8, dailyConsumption: 2, lastPurchasedAt: dayjs().subtract(8, 'day').toISOString(), supplierName: '国联水产', status: 'CRITICAL' },
  ];
  return items.map((item, i) => ({ ...item, id: id('inv', i + 1) } as InventoryItem));
}

function genPurchaseOrders(): PurchaseOrder[] {
  const approvalsTemplate = (levels: number) => {
    const arr: PurchaseOrder['approvals'] = [];
    for (let l = 1; l <= levels; l++) {
      arr.push({ level: l as 1 | 2 | 3, approved: true, approverId: id('u', 'approver' + l), approverName: ['王后勤', '李德育', '系统管理员'][l - 1], comment: '同意', approvedAt: dayjs().subtract(levels - l + 1, 'hour').toISOString() });
    }
    return arr;
  };
  return [
    {
      id: id('po', 1),
      orderNo: 'PO20240101001',
      title: '一月份蔬菜采购',
      items: [{ itemId: id('inv', 1), itemName: '大白菜', quantity: 100, unit: 'kg', estimatedPrice: 2.5 }],
      totalAmount: 250,
      status: 'EXECUTED',
      currentLevel: 3,
      createdBy: id('u', 'logistics'),
      createdAt: dayjs().subtract(3, 'day').toISOString(),
      approvals: approvalsTemplate(3),
    },
    {
      id: id('po', 2),
      orderNo: 'PO20240102002',
      title: '紧急肉类补货',
      items: [
        { itemId: id('inv', 9), itemName: '牛肉', quantity: 20, unit: 'kg', estimatedPrice: 68 },
        { itemId: id('inv', 8), itemName: '猪里脊', quantity: 30, unit: 'kg', estimatedPrice: 35 },
      ],
      totalAmount: 2410,
      status: 'PENDING_L2',
      currentLevel: 2,
      createdBy: id('u', 'logistics'),
      createdAt: dayjs().subtract(2, 'hour').toISOString(),
      approvals: [{ level: 1, approved: true, approverId: id('u', 'logistics'), approverName: '王后勤', comment: '已审核，库存急需', approvedAt: dayjs().subtract(1, 'hour').toISOString() }, { level: 2, approved: false }, { level: 3, approved: false }],
    },
    {
      id: id('po', 3),
      orderNo: 'PO20240102003',
      title: '调料类采购',
      items: [{ itemId: id('inv', 16), itemName: '老抽', quantity: 20, unit: '瓶', estimatedPrice: 15 }],
      totalAmount: 300,
      status: 'PENDING_L1',
      currentLevel: 1,
      createdBy: id('u', 'logistics'),
      createdAt: dayjs().subtract(30, 'minute').toISOString(),
      approvals: [{ level: 1, approved: false }, { level: 2, approved: false }, { level: 3, approved: false }],
    },
  ];
}

function genBuses(): Bus[] {
  const routes = [
    { id: 'r1', name: '东线1号', lat: 39.9042, lng: 116.4074 },
    { id: 'r2', name: '西线2号', lat: 39.9200, lng: 116.3800 },
    { id: 'r3', name: '南线3号', lat: 39.8900, lng: 116.4200 },
    { id: 'r4', name: '北线4号', lat: 39.9300, lng: 116.4000 },
    { id: 'r5', name: '环线5号', lat: 39.9100, lng: 116.3950 },
  ];
  return routes.map((r, i) => ({
    id: id('bus', i + 1),
    busNumber: `校车0${i + 1}号`,
    plateNumber: `京A${String(80000 + i * 137).padStart(5, '0')}`,
    routeId: r.id,
    routeName: r.name,
    driverName: `司机${['张', '王', '李', '赵', '刘'][i]}师傅`,
    driverPhone: `135${String(40000000 + i * 111).padStart(8, '0')}`,
    capacity: 45,
    currentOccupancy: Math.floor(20 + Math.random() * 20),
    status: ['ON_ROUTE', 'AT_STATION', 'ON_ROUTE', 'AT_SCHOOL', 'ON_ROUTE'][i] as Bus['status'],
    currentPosition: {
      lat: r.lat + (Math.random() - 0.5) * 0.02,
      lng: r.lng + (Math.random() - 0.5) * 0.02,
      timestamp: dayjs().toISOString(),
      speed: Math.floor(20 + Math.random() * 40),
      heading: Math.floor(Math.random() * 360),
    },
    position3D: { x: i * 20 - 40, y: 0, z: 100, rotationY: Math.PI * (i / 5) },
    estimatedArrival: dayjs().add(10 + i * 5, 'minute').toISOString(),
    nextStation: ['望京站', '中关村站', '国贸站', '五道口站', '东直门站'][i],
    onboardStudents: Array.from({ length: 5 + i }, (_, k) => ({
      studentId: id('u', `s${i * 5 + k + 1}`),
      studentName: `学生${i * 5 + k + 1}`,
      grade: 7 + (k % 6),
      className: `${gradeNames[k % 6]}1班`,
      parentPhone: `136${String(50000000 + i * 100 + k).padStart(8, '0')}`,
      boardedAt: dayjs().subtract(10 + k, 'minute').toISOString(),
      boardStation: '起点站',
    })),
  }));
}

function genVisitors(users: User[]): Visitor[] {
  const headTeachers = users.filter((u) => u.role === 'head_teacher');
  const students = users.filter((u) => u.role === 'student');
  const now = dayjs();
  const statuses: ApprovalStatus[] = ['PENDING_L1', 'APPROVED', 'PENDING_L2', 'APPROVED', 'EXECUTED', 'REJECTED'];
  const visitorList: Visitor[] = [];
  const relations: Visitor['relation'][] = ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆'];
  for (let i = 0; i < 12; i++) {
    const stu = students[i % students.length];
    const ht = headTeachers[i % headTeachers.length];
    const status = statuses[i % statuses.length];
    const date = now.add(i % 3, 'day').format('YYYY-MM-DD');
    visitorList.push({
      id: id('v', i + 1),
      visitorName: `${relations[i % relations.length]}${i + 1}`,
      idCardNo: `1101011980${String(1000 + i * 73).padStart(8, '0')}`,
      phone: `138${String(70000000 + i * 137).padStart(8, '0')}`,
      relation: relations[i % relations.length],
      visitDate: date,
      startTime: '09:00',
      endTime: '11:00',
      purpose: ['参加家长会', '送物品', '与老师沟通', '参观校园', '办理手续'][i % 5],
      targetType: 'STUDENT',
      targetId: stu.id,
      targetName: stu.name,
      targetLocation: `教学楼A${(i % 4) + 1}楼`,
      headTeacherId: ht.id,
      status,
      qrCodeToken: status === 'APPROVED' || status === 'EXECUTED' ? `QR_${i}_${Date.now()}` : undefined,
      checkInTime: status === 'EXECUTED' ? now.add(i, 'hour').toISOString() : undefined,
      createdAt: now.subtract(i, 'hour').toISOString(),
    });
  }
  return visitorList;
}

function genDevices(classrooms: Classroom[]): Device[] {
  const devices: Device[] = [];
  const types: DeviceType[] = ['PROJECTOR', 'AIR_CONDITION', 'COMPUTER', 'LIGHT', 'ACCESS_DOOR', 'FIRE_ALARM'];
  const typeNames: Record<DeviceType, string> = {
    PROJECTOR: '投影仪',
    AIR_CONDITION: '空调',
    COMPUTER: '电脑',
    LIGHT: '照明系统',
    BLACKBOARD: '智慧黑板',
    CCTV: '监控摄像头',
    ACCESS_DOOR: '门禁',
    FIRE_ALARM: '消防报警器',
  };
  let did = 1;
  for (const cls of classrooms) {
    const devTypes = ['PROJECTOR', 'AIR_CONDITION', 'COMPUTER', 'LIGHT', 'ACCESS_DOOR', 'BLACKBOARD'] as DeviceType[];
    for (const t of devTypes) {
      const isFault = Math.random() < 0.08;
      devices.push({
        id: id('dev', did++),
        deviceCode: `${t}-${String(did).padStart(5, '0')}`,
        name: `${cls.roomNumber}${typeNames[t]}`,
        type: t,
        location: `${cls.buildingId}楼${cls.floor}层${cls.roomNumber}教室`,
        classroomId: cls.id,
        status: isFault ? 'FAULT' : 'NORMAL',
        lastMaintenanceDate: dayjs().subtract(Math.floor(Math.random() * 90), 'day').toISOString(),
        nextMaintenanceDate: dayjs().add(Math.floor(Math.random() * 90), 'day').toISOString(),
        faultDescription: isFault ? ['无法启动', '噪音过大', '显示异常', '连接失败'][Math.floor(Math.random() * 4)] : undefined,
        faultTime: isFault ? dayjs().subtract(Math.floor(Math.random() * 48), 'hour').toISOString() : undefined,
        position3D: { x: cls.position3D.x + did % 3, y: cls.position3D.y + 1, z: cls.position3D.z + (did % 5) - 2, scene: 'teaching' },
      });
    }
  }
  const cctvCodes = ['图书馆', '食堂', '校门', '操场', '宿舍'];
  for (let i = 0; i < 20; i++) {
    const loc = cctvCodes[i % cctvCodes.length];
    devices.push({
      id: id('dev', did++),
      deviceCode: `CCTV-${String(did).padStart(5, '0')}`,
      name: `${loc}监控${i + 1}`,
      type: 'CCTV',
      location: loc,
      status: 'NORMAL',
      lastMaintenanceDate: dayjs().subtract(Math.floor(Math.random() * 60), 'day').toISOString(),
      nextMaintenanceDate: dayjs().add(Math.floor(Math.random() * 60), 'day').toISOString(),
      position3D: { x: (i - 10) * 5, y: 3, z: (i % 4) * 10, scene: ['teaching', 'library', 'canteen', 'dormitory'][i % 4] as Device['position3D']['scene'] },
    });
  }
  for (let i = 0; i < 15; i++) {
    const loc = ['教学楼走廊', '图书馆', '食堂', '校门', '办公室'][i % 5];
    devices.push({
      id: id('dev', did++),
      deviceCode: `FA-${String(did).padStart(5, '0')}`,
      name: `${loc}消防报警${i + 1}`,
      type: 'FIRE_ALARM',
      location: loc,
      status: 'NORMAL',
      lastMaintenanceDate: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString(),
      nextMaintenanceDate: dayjs().add(Math.floor(Math.random() * 30), 'day').toISOString(),
      position3D: { x: (i - 7) * 6, y: 2.5, z: (i % 3) * 8, scene: ['teaching', 'library', 'canteen', 'dormitory'][i % 4] as Device['position3D']['scene'] },
    });
  }
  return devices;
}

function genWorkOrders(devices: Device[], users: User[]): WorkOrder[] {
  const faultDevices = devices.filter((d) => d.status === 'FAULT' || d.status === 'WARNING').slice(0, 10);
  const reporters = users.filter((u) => u.role !== 'student' && u.role !== 'parent');
  const assignees = users.filter((u) => u.role === 'logistics_director' || u.role === 'teacher');
  const statuses: WorkOrder['status'][] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'NEW'];
  const priorities: WorkOrder['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'MEDIUM', 'LOW', 'HIGH', 'MEDIUM', 'CRITICAL', 'LOW'];
  const titles = ['无法启动', '画面模糊', '无法制冷', '噪音异常', '无法连接', '灯泡烧坏', '按键失灵', '屏幕黑屏', '温度异常', '网络故障'];
  const now = dayjs();

  return faultDevices.map((dev, i) => {
    const status = statuses[i];
    const reporter = reporters[i % reporters.length];
    const assignee = status !== 'NEW' ? assignees[i % assignees.length] : undefined;
    return {
      id: id('wo', i + 1),
      ticketNo: `WO${now.format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}`,
      deviceId: dev.id,
      deviceName: dev.name,
      deviceType: dev.type,
      location: dev.location,
      reporterId: reporter.id,
      reporterName: reporter.name,
      reporterPhone: reporter.phone,
      faultTitle: titles[i],
      faultDescription: `${dev.type} ${titles[i]}，影响正常教学，请尽快处理。`,
      priority: priorities[i],
      status,
      assigneeId: assignee?.id,
      assigneeName: assignee?.name,
      createdAt: now.subtract(i * 5, 'hour').toISOString(),
      assignedAt: status !== 'NEW' ? now.subtract(i * 5 + 1, 'hour').toISOString() : undefined,
      startedAt: status === 'IN_PROGRESS' || status === 'PENDING_VERIFY' || status === 'COMPLETED' ? now.subtract(i * 5 + 2, 'hour').toISOString() : undefined,
      completedAt: status === 'COMPLETED' ? now.subtract(i * 2, 'hour').toISOString() : undefined,
      repairNote: status === 'COMPLETED' ? '已更换配件，测试正常' : undefined,
      repairCost: status === 'COMPLETED' ? Math.floor(Math.random() * 500) + 50 : undefined,
      rating: status === 'COMPLETED' ? (4 + (i % 2)) as 1 | 2 | 3 | 4 | 5 : undefined,
    };
  });
}

function genLogs(users: User[]): OperationLog[] {
  const actions: Array<{ action: string; module: string }> = [
    { action: 'LOGIN', module: 'AUTH' },
    { action: 'CREATE', module: 'SCHEDULE' },
    { action: 'APPROVE', module: 'APPROVAL' },
    { action: 'UPDATE', module: 'DEVICE' },
    { action: 'EXPORT', module: 'REPORT' },
    { action: 'CREATE', module: 'LIBRARY' },
    { action: 'CREATE', module: 'VISITOR' },
    { action: 'UPDATE', module: 'CANTEEN' },
  ];
  const now = dayjs();
  const roles: UserRole[] = ['principal', 'logistics_director', 'moral_director', 'teacher', 'head_teacher'];
  return Array.from({ length: 200 }, (_, i) => {
    const roleUsers = users.filter((u) => u.role === roles[i % roles.length]);
    const u = roleUsers[i % Math.max(1, roleUsers.length)] || users[0];
    const am = actions[i % actions.length];
    return {
      id: id('log', i + 1),
      userId: u.id,
      userName: u.name,
      userRole: u.role,
      action: am.action,
      module: am.module,
      targetId: i % 3 === 0 ? `target_${i}` : undefined,
      targetName: i % 3 === 0 ? `目标${i}` : undefined,
      ipAddress: `192.168.1.${(i % 254) + 1}`,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      detail: i % 2 === 0 ? JSON.stringify({ note: `操作${i}` }) : undefined,
      status: i % 17 === 0 ? 'FAILURE' : 'SUCCESS',
      createdAt: now.subtract(i * 30, 'minute').toISOString(),
    };
  });
}

export function generateSeedData() {
  const users = genUsers();
  const classrooms = genClassrooms();
  const courses = genCourses(users, classrooms);
  const seats = genSeats();
  const dishes = genDishes();
  const inventory = genInventory();
  const purchaseOrders = genPurchaseOrders();
  const buses = genBuses();
  const visitors = genVisitors(users);
  const devices = genDevices(classrooms);
  const workOrders = genWorkOrders(devices, users);
  const logs = genLogs(users);
  const reservations: Reservation[] = [];
  const conflicts: ScheduleConflict[] = [];
  const anomalies: BusAnomaly[] = [];

  return {
    users,
    classrooms,
    courses,
    librarySeats: seats,
    reservations,
    dishes,
    inventory,
    purchaseOrders,
    buses,
    busAnomalies: anomalies,
    visitors,
    devices,
    workOrders,
    operationLogs: logs,
    scheduleConflicts: conflicts,
  };
}

export type SeedData = ReturnType<typeof generateSeedData>;
