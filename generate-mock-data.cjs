const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PASSWORD_HASH = '$2a$10$4G3KaJd4wqxvRo13mG2w/.ztg3QFzfZWBf0xdsiS5iBMdiQC5MfQ2';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return '1' + ['3', '5', '7', '8', '9'][randomInt(0, 4)] + 
    Array.from({ length: 9 }, () => randomInt(0, 9)).join('');
}

function randomIdCard() {
  return randomInt(100000, 999999) + '19' + randomInt(70, 99) + 
    String(randomInt(1, 12)).padStart(2, '0') + 
    String(randomInt(1, 28)).padStart(2, '0') + 
    randomInt(1000, 9999);
}

function randomDate(baseDaysAgo = 365) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, baseDaysAgo));
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
}

function randomDateRecent(daysAgo = 30) {
  return randomDate(daysAgo);
}

function futureDate(daysLater = 30) {
  const d = new Date();
  d.setDate(d.getDate() + randomInt(1, daysLater));
  return d.toISOString();
}

function todayAt(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕'];
const MALE_NAMES = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '超', '明', '刚', '平', '辉', '鹏', '华', '飞', '鑫', '波', '斌', '宇', '浩', '凯', '健', '俊', '帆', '晨', '博', '文', '轩', '睿'];
const FEMALE_NAMES = ['芳', '娜', '敏', '静', '丽', '艳', '娟', '莉', '玲', '桂', '娣', '娥', '英', '慧', '莹', '婷', '欣', '怡', '雪', '梦', '琪', '瑶', '馨', '悦', '妍', '琳', '薇', '紫', '佳', '诗'];

function randomName(maleBias = 0.5) {
  const surname = randomPick(SURNAMES);
  const isMale = Math.random() < maleBias;
  const given = isMale ? randomPick(MALE_NAMES) + (Math.random() < 0.4 ? randomPick(MALE_NAMES) : '') 
                       : randomPick(FEMALE_NAMES) + (Math.random() < 0.4 ? randomPick(FEMALE_NAMES) : '');
  return surname + given;
}

const SUBJECTS = [
  { name: '语文', equipment: ['blackboard'], category: '主科' },
  { name: '数学', equipment: ['blackboard'], category: '主科' },
  { name: '英语', equipment: ['blackboard', 'projector'], category: '主科' },
  { name: '物理', equipment: ['blackboard', 'lab'], category: '理科' },
  { name: '化学', equipment: ['blackboard', 'lab'], category: '理科' },
  { name: '生物', equipment: ['blackboard', 'lab'], category: '理科' },
  { name: '政治', equipment: ['blackboard'], category: '文科' },
  { name: '历史', equipment: ['blackboard', 'projector'], category: '文科' },
  { name: '地理', equipment: ['blackboard', 'projector'], category: '文科' },
  { name: '体育', equipment: [], category: '艺体' },
  { name: '音乐', equipment: ['music'], category: '艺体' },
  { name: '美术', equipment: ['art'], category: '艺体' },
  { name: '信息技术', equipment: ['computer'], category: '技术' },
];

const TIME_SLOTS = [
  { start: '08:00', end: '08:45' },
  { start: '08:55', end: '09:40' },
  { start: '10:00', end: '10:45' },
  { start: '10:55', end: '11:40' },
  { start: '14:00', end: '14:45' },
  { start: '14:55', end: '15:40' },
  { start: '16:00', end: '16:45' },
  { start: '16:55', end: '17:40' },
];

const DISH_WINDOWS = [
  { id: uuid(), name: '1号窗口·家常炒菜', categories: ['热菜', '主食'] },
  { id: uuid(), name: '2号窗口·川湘风味', categories: ['热菜', '主食'] },
  { id: uuid(), name: '3号窗口·营养套餐', categories: ['热菜', '主食', '汤羹'] },
  { id: uuid(), name: '4号窗口·面食面点', categories: ['主食', '小吃'] },
  { id: uuid(), name: '5号窗口·轻食沙拉', categories: ['凉菜', '饮品'] },
  { id: uuid(), name: '6号窗口·特色小吃', categories: ['小吃', '饮品'] },
];

const DISH_NAMES = [
  { name: '红烧肉', category: '热菜', ingredients: ['五花肉', '生抽', '老抽', '冰糖', '八角'], allergens: [], price: 12 },
  { name: '宫保鸡丁', category: '热菜', ingredients: ['鸡胸肉', '花生米', '干辣椒', '黄瓜', '胡萝卜'], allergens: ['花生'], price: 10 },
  { name: '鱼香肉丝', category: '热菜', ingredients: ['猪里脊', '木耳', '胡萝卜', '青椒', '郫县豆瓣酱'], allergens: [], price: 10 },
  { name: '麻婆豆腐', category: '热菜', ingredients: ['嫩豆腐', '牛肉末', '花椒', '郫县豆瓣酱'], allergens: [], price: 8 },
  { name: '回锅肉', category: '热菜', ingredients: ['五花肉', '青蒜', '郫县豆瓣酱', '甜面酱'], allergens: [], price: 12 },
  { name: '水煮鱼', category: '热菜', ingredients: ['草鱼', '豆芽', '干辣椒', '花椒', '蛋清'], allergens: ['海鲜'], price: 15 },
  { name: '糖醋里脊', category: '热菜', ingredients: ['猪里脊', '番茄酱', '白糖', '醋', '淀粉'], allergens: ['蛋奶'], price: 12 },
  { name: '青椒土豆丝', category: '热菜', ingredients: ['土豆', '青椒', '醋', '蒜'], allergens: [], price: 6 },
  { name: '西红柿炒蛋', category: '热菜', ingredients: ['西红柿', '鸡蛋', '葱花', '白糖'], allergens: ['蛋奶'], price: 7 },
  { name: '蒜蓉西兰花', category: '热菜', ingredients: ['西兰花', '大蒜', '蚝油'], allergens: [], price: 8 },
  { name: '白米饭', category: '主食', ingredients: ['大米', '水'], allergens: [], price: 1 },
  { name: '炸酱面', category: '主食', ingredients: ['面条', '五花肉末', '黄酱', '黄瓜丝', '胡萝卜丝'], allergens: ['麸质'], price: 9 },
  { name: '牛肉拉面', category: '主食', ingredients: ['拉面', '牛肉', '白萝卜', '香菜', '葱'], allergens: ['麸质'], price: 12 },
  { name: '三鲜水饺', category: '主食', ingredients: ['面粉', '猪肉', '虾仁', '韭菜', '鸡蛋'], allergens: ['海鲜', '麸质', '蛋奶'], price: 13 },
  { name: '小笼包', category: '主食', ingredients: ['面粉', '猪肉末', '猪皮冻', '生姜', '葱'], allergens: ['麸质'], price: 10 },
  { name: '凉拌黄瓜', category: '凉菜', ingredients: ['黄瓜', '大蒜', '醋', '生抽', '香油'], allergens: [], price: 5 },
  { name: '口水鸡', category: '凉菜', ingredients: ['鸡腿', '花生米', '花椒', '辣椒油', '生抽'], allergens: ['花生', '坚果'], price: 14 },
  { name: '凉拌三丝', category: '凉菜', ingredients: ['海带丝', '胡萝卜丝', '粉丝', '蒜', '醋'], allergens: ['海鲜'], price: 6 },
  { name: '紫菜蛋花汤', category: '汤羹', ingredients: ['紫菜', '鸡蛋', '虾皮', '葱花'], allergens: ['海鲜', '蛋奶'], price: 3 },
  { name: '西红柿鸡蛋汤', category: '汤羹', ingredients: ['西红柿', '鸡蛋', '葱花', '香菜'], allergens: ['蛋奶'], price: 3 },
  { name: '玉米排骨汤', category: '汤羹', ingredients: ['猪排骨', '玉米', '胡萝卜', '姜片'], allergens: [], price: 6 },
  { name: '酸辣汤', category: '汤羹', ingredients: ['豆腐', '木耳', '鸡蛋', '醋', '胡椒粉'], allergens: ['蛋奶'], price: 4 },
  { name: '煎饼果子', category: '小吃', ingredients: ['绿豆面', '鸡蛋', '薄脆', '甜面酱', '葱花'], allergens: ['蛋奶', '麸质'], price: 7 },
  { name: '肉夹馍', category: '小吃', ingredients: ['白吉馍', '卤五花肉', '青椒'], allergens: ['麸质'], price: 8 },
  { name: '手抓饼', category: '小吃', ingredients: ['面饼', '鸡蛋', '生菜', '番茄酱'], allergens: ['蛋奶', '麸质'], price: 6 },
  { name: '烤香肠', category: '小吃', ingredients: ['猪肉肠'], allergens: [], price: 4 },
  { name: '茶叶蛋', category: '小吃', ingredients: ['鸡蛋', '茶叶', '八角', '桂皮', '酱油'], allergens: ['蛋奶'], price: 2 },
  { name: '鲜榨橙汁', category: '饮品', ingredients: ['橙子'], allergens: [], price: 6 },
  { name: '现磨豆浆', category: '饮品', ingredients: ['黄豆', '水', '白糖'], allergens: ['坚果'], price: 3 },
  { name: '酸梅汤', category: '饮品', ingredients: ['乌梅', '山楂', '陈皮', '甘草', '冰糖'], allergens: [], price: 4 },
];

const INVENTORY_CATEGORIES = {
  '蔬菜': ['大白菜', '土豆', '西红柿', '黄瓜', '青椒', '胡萝卜', '西兰花', '洋葱', '茄子', '豆角'],
  '肉类': ['猪五花肉', '猪里脊', '牛肉', '鸡胸肉', '鸡腿', '鸡蛋', '鸭肉', '羊肉'],
  '米面': ['大米', '面粉', '挂面', '小米', '糯米', '玉米糁'],
  '调料': ['生抽', '老抽', '醋', '白糖', '盐', '味精', '花椒', '八角', '郫县豆瓣酱', '甜面酱'],
  '油料': ['花生油', '菜籽油', '大豆油', '芝麻油', '橄榄油'],
  '冻品': ['冻虾仁', '冻带鱼', '冻鸡翅', '冻牛排', '冻丸子', '冻豆腐'],
};

const SUPPLIERS = ['绿源农贸有限公司', '天顺肉联厂', '粮油批发中心', '百味调料商行', '海珍品冻品批发', '宏达蔬菜基地'];

const BUS_ROUTES = [
  { id: uuid(), name: '东线·科技园方向', stations: ['学校南门', '科技园A站', '市民中心', '东方花园', '阳光小区'] },
  { id: uuid(), name: '西线·高新区方向', stations: ['学校南门', '高新区管委会', '软件园', '万达广场', '幸福里'] },
  { id: uuid(), name: '南线·滨河路方向', stations: ['学校南门', '滨河公园', '奥体中心', '彩虹城', '金桂苑'] },
  { id: uuid(), name: '北线·大学城方向', stations: ['学校南门', '大学城东', '师范大学', '理工学院', '书香门第'] },
  { id: uuid(), name: '中线·老城区方向', stations: ['学校南门', '人民医院', '步行街', '文化宫', '梅园新村'] },
];

const MODULES = ['用户管理', '教室管理', '排课系统', '图书馆', '食堂管理', '库存管理', '采购系统', '校车管理', '访客系统', '设备管理', '工单系统', '系统设置', '权限管理', '报表统计', '3D可视化'];
const ACTIONS = ['登录', '登出', '创建', '修改', '删除', '查询', '导出', '导入', '审批通过', '审批驳回', '分配', '完成', '报修', '派单', '预警', '同步', '配置', '重置密码'];

// ==================== 生成用户 ====================
function generateUsers() {
  const users = [];
  const classroomsInfo = [];

  for (let grade = 7; grade <= 12; grade++) {
    for (let cls = 1; cls <= 2; cls++) {
      const classId = uuid();
      const className = `${grade}年级${cls}班`;
      classroomsInfo.push({ grade, cls, classId, className, students: [], headTeacherId: null });
    }
  }

  let studentCounter = 1;
  for (const ci of classroomsInfo) {
    for (let i = 0; i < 4; i++) {
      const isMale = Math.random() < 0.5;
      const name = randomName(isMale ? 0.55 : 0.45);
      const pinyin = 'stu' + String(studentCounter).padStart(3, '0');
      users.push({
        id: uuid(),
        username: pinyin,
        name,
        role: 'student',
        passwordHash: PASSWORD_HASH,
        grade: ci.grade,
        classId: ci.classId,
        phone: randomPhone(),
        createdAt: randomDate(500),
      });
      ci.students.push(users[users.length - 1]);
      studentCounter++;
    }
  }

  const teachers = [];
  const teacherNames = [];
  for (let i = 0; i < 12; i++) {
    const isMale = Math.random() < 0.5;
    const name = randomName(isMale ? 0.5 : 0.5);
    const pinyin = 'tea' + String(i + 1).padStart(3, '0');
    const t = {
      id: uuid(),
      username: pinyin,
      name,
      role: 'teacher',
      passwordHash: PASSWORD_HASH,
      employeeId: 'EMP' + String(20200001 + i),
      phone: randomPhone(),
      createdAt: randomDate(800),
    };
    users.push(t);
    teachers.push(t);
    teacherNames.push(name);
  }

  let htc = 0;
  for (const ci of classroomsInfo) {
    const ht = teachers[htc % teachers.length];
    users.find(u => u.id === ht.id).role = 'head_teacher';
    ci.headTeacherId = ht.id;
    htc++;
  }

  users.push({
    id: uuid(),
    username: 'logistics01',
    name: randomName(0.7),
    role: 'logistics_director',
    passwordHash: PASSWORD_HASH,
    employeeId: 'EMP20180001',
    phone: randomPhone(),
    createdAt: randomDate(1200),
  });

  users.push({
    id: uuid(),
    username: 'moral01',
    name: randomName(0.5),
    role: 'moral_director',
    passwordHash: PASSWORD_HASH,
    employeeId: 'EMP20180002',
    phone: randomPhone(),
    createdAt: randomDate(1200),
  });

  users.push({
    id: uuid(),
    username: 'principal',
    name: randomName(0.8),
    role: 'principal',
    passwordHash: PASSWORD_HASH,
    employeeId: 'EMP20150001',
    phone: randomPhone(),
    createdAt: randomDate(1800),
  });

  const students = users.filter(u => u.role === 'student');
  const parentCount = Math.min(18, students.length);
  for (let i = 0; i < parentCount; i++) {
    const stu = students[i];
    const isMale = Math.random() < 0.5;
    users.push({
      id: uuid(),
      username: 'par' + String(i + 1).padStart(3, '0'),
      name: randomName(isMale ? 0.5 : 0.5),
      role: 'parent',
      passwordHash: PASSWORD_HASH,
      phone: randomPhone(),
      createdAt: randomDate(400),
    });
  }

  return { users, classroomsInfo, teachers };
}

// ==================== 生成教室 ====================
function generateClassrooms() {
  const classrooms = [];
  const buildingId = uuid();
  const floors = [1, 2, 3, 4];
  const roomsPerFloor = 6;

  for (const floor of floors) {
    for (let i = 1; i <= roomsPerFloor; i++) {
      const idx = (floor - 1) * roomsPerFloor + i;
      const baseEquipment = ['projector', 'blackboard', 'computer'];
      const extraEquipment = [];
      if (idx % 4 === 1) extraEquipment.push('lab');
      if (idx % 6 === 2) extraEquipment.push('music');
      if (idx % 6 === 3) extraEquipment.push('art');

      classrooms.push({
        id: uuid(),
        buildingId,
        floor,
        roomNumber: `${floor}0${i}`,
        capacity: randomInt(45, 60),
        occupiedSeats: randomInt(0, 55),
        equipment: [...baseEquipment, ...extraEquipment],
        sensors: {
          temperature: +(randomInt(20, 28) + Math.random()).toFixed(1),
          humidity: +(randomInt(35, 65) + Math.random()).toFixed(1),
          illuminance: randomInt(200, 800),
        },
        position3D: {
          x: (i - 1) * 15 + randomInt(-2, 2),
          y: (floor - 1) * 4,
          z: randomInt(-10, 10),
          floorHeight: 4,
        },
      });
    }
  }
  return classrooms;
}

// ==================== 生成课程 ====================
function generateCourses(teachers, classroomsInfo, classrooms) {
  const courses = [];
  const subjectCounts = {};

  for (const ci of classroomsInfo) {
    for (const subject of SUBJECTS) {
      subjectCounts[subject.name] = subjectCounts[subject.name] || { perWeek: 0 };
    }
  }

  for (const ci of classroomsInfo) {
    const usedSlots = new Set();
    const teacherSubjects = {};

    for (const subject of SUBJECTS) {
      let perWeek = 5;
      if (['体育', '音乐', '美术', '信息技术'].includes(subject.name)) perWeek = 2;
      if (['物理', '化学', '生物'].includes(subject.name) && ci.grade < 8) continue;
      if (['物理'].includes(subject.name)) perWeek = 3;
      if (['化学', '生物'].includes(subject.name)) perWeek = 2;
      if (['政治', '历史', '地理'].includes(subject.name)) perWeek = 2;
      if (['语文', '数学', '英语'].includes(subject.name)) perWeek = ci.grade >= 10 ? 7 : 6;

      const teacher = teachers[randomInt(0, teachers.length - 1)];

      let assigned = 0;
      let attempts = 0;
      while (assigned < perWeek && attempts < 200) {
        const weekday = randomInt(1, 5);
        const slotIdx = randomInt(0, TIME_SLOTS.length - 1);
        const slotKey = `${weekday}-${slotIdx}`;

        if (!usedSlots.has(slotKey)) {
          usedSlots.add(slotKey);
          const slot = TIME_SLOTS[slotIdx];

          let classroomId = undefined;
          if (!['体育'].includes(subject.name)) {
            const suitableClassrooms = classrooms.filter(c => 
              subject.equipment.every(e => c.equipment.includes(e))
            );
            if (suitableClassrooms.length > 0) {
              classroomId = suitableClassrooms[randomInt(0, suitableClassrooms.length - 1)].id;
            }
          }

          courses.push({
            id: uuid(),
            name: subject.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            grade: ci.grade,
            classId: ci.classId,
            classroomId,
            startTime: slot.start,
            endTime: slot.end,
            weekday: weekday,
            requiredEquipment: subject.equipment.length > 0 ? subject.equipment : undefined,
            priority: ci.grade,
          });
          assigned++;
        }
        attempts++;
      }
    }
  }

  return courses;
}

// ==================== 生成图书馆座位 ====================
function generateLibrarySeats(students) {
  const seats = [];
  const zones = ['A安静区', 'B讨论区', 'C电子阅览区', 'D靠窗区'];
  const zoneCoords = {
    'A安静区': { xBase: 0, zBase: 0 },
    'B讨论区': { xBase: 30, zBase: 0 },
    'C电子阅览区': { xBase: 0, zBase: 25 },
    'D靠窗区': { xBase: 30, zBase: 25 },
  };
  const statuses = ['AVAILABLE', 'RESERVED', 'IN_USE', 'AVAILABLE', 'AVAILABLE', 'IN_USE', 'RESERVED', 'AVAILABLE'];

  let seatNum = 1;
  for (const zone of zones) {
    const coords = zoneCoords[zone];
    for (let i = 0; i < 20; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const status = randomPick(statuses);
      let currentStudentId, currentStudentName, reservedUntil, checkedInAt;

      if (status === 'IN_USE' && students.length > 0) {
        const stu = students[randomInt(0, students.length - 1)];
        currentStudentId = stu.id;
        currentStudentName = stu.name;
        checkedInAt = todayAt(randomInt(8, 15), randomInt(0, 59));
      }
      if (status === 'RESERVED' && students.length > 0) {
        const stu = students[randomInt(0, students.length - 1)];
        currentStudentId = stu.id;
        currentStudentName = stu.name;
        reservedUntil = todayAt(randomInt(14, 20), randomInt(0, 59));
      }

      seats.push({
        id: uuid(),
        seatNumber: zone.charAt(0) + String(seatNum).padStart(3, '0'),
        zone,
        status,
        position3D: {
          x: coords.xBase + col * 3 + randomInt(-1, 1),
          y: 0,
          z: coords.zBase + row * 3 + randomInt(-1, 1),
        },
        currentStudentId,
        currentStudentName,
        reservedUntil,
        checkedInAt,
        usedMinutesToday: status === 'IN_USE' ? randomInt(30, 240) : randomInt(0, 300),
      });
      seatNum++;
    }
  }
  return seats;
}

// ==================== 生成菜品 ====================
function generateDishes() {
  const dishes = [];
  for (let i = 0; i < 30; i++) {
    const dishTemplate = DISH_NAMES[i % DISH_NAMES.length];
    const windowIdx = i % DISH_WINDOWS.length;
    const window = DISH_WINDOWS[windowIdx];

    const sold = randomInt(50, 200);
    const remaining = randomInt(0, 80);

    dishes.push({
      id: uuid(),
      name: dishTemplate.name,
      windowId: window.id,
      windowName: window.name,
      category: dishTemplate.category,
      price: dishTemplate.price,
      nutrition: {
        calories: randomInt(80, 600),
        protein: +(randomInt(2, 35) + Math.random()).toFixed(1),
        fat: +(randomInt(1, 25) + Math.random()).toFixed(1),
        carbohydrate: +(randomInt(5, 80) + Math.random()).toFixed(1),
        sodium: randomInt(100, 1500),
      },
      ingredients: dishTemplate.ingredients,
      allergens: dishTemplate.allergens.length > 0 ? dishTemplate.allergens : undefined,
      soldToday: sold,
      remainingServings: remaining,
      position3D: {
        x: windowIdx * 8 + (i % 5) * 1.5,
        y: 1,
        z: randomInt(-5, 5),
      },
    });
  }
  return dishes;
}

// ==================== 生成库存 ====================
function generateInventory() {
  const items = [];
  const allItems = [];
  for (const [cat, names] of Object.entries(INVENTORY_CATEGORIES)) {
    for (const name of names) allItems.push({ cat, name });
  }

  const pickItems = [];
  while (pickItems.length < 40 && allItems.length > 0) {
    const idx = randomInt(0, allItems.length - 1);
    pickItems.push(allItems[idx]);
    allItems.splice(idx, 1);
  }
  while (pickItems.length < 40) {
    pickItems.push(randomPick(Array.from(Object.entries(INVENTORY_CATEGORIES)).flatMap(([c, ns]) => ns.map(n => ({ cat: c, name: n })))));
  }

  const units = {
    '蔬菜': 'kg', '肉类': 'kg', '米面': '袋', '调料': '瓶', '油料': '桶', '冻品': '箱',
  };

  for (let i = 0; i < 40; i++) {
    const item = pickItems[i];
    const safetyThreshold = randomInt(20, 100);
    const dailyConsumption = +(randomInt(3, 25) + Math.random()).toFixed(1);
    const daysOfStock = Math.random();
    let currentStock;
    let status;

    if (daysOfStock < 0.2) {
      currentStock = +(dailyConsumption * randomInt(1, 3)).toFixed(1);
      status = currentStock < safetyThreshold * 0.5 ? 'CRITICAL' : 'WARNING';
    } else if (daysOfStock < 0.4) {
      currentStock = +(dailyConsumption * randomInt(3, 7)).toFixed(1);
      status = currentStock < safetyThreshold ? 'WARNING' : 'NORMAL';
    } else {
      currentStock = +(dailyConsumption * randomInt(7, 30)).toFixed(1);
      status = 'NORMAL';
    }

    items.push({
      id: uuid(),
      name: item.name,
      category: item.cat,
      unit: units[item.cat],
      currentStock,
      safetyThreshold,
      dailyConsumption,
      lastPurchasedAt: randomDate(60),
      supplierName: randomPick(SUPPLIERS),
      status,
    });
  }
  return items;
}

// ==================== 生成采购单 ====================
function generatePurchaseOrders(inventory, users) {
  const orders = [];
  const statuses = ['DRAFT', 'PENDING_L1', 'PENDING_L2', 'PENDING_L3', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED'];
  const logistics = users.find(u => u.role === 'logistics_director') || users[0];
  const principal = users.find(u => u.role === 'principal') || users[0];
  const moral = users.find(u => u.role === 'moral_director') || users[0];

  for (let i = 0; i < 8; i++) {
    const status = statuses[i % statuses.length];
    const itemCount = randomInt(3, 8);
    const items = [];
    let total = 0;

    for (let j = 0; j < itemCount; j++) {
      const inv = inventory[randomInt(0, inventory.length - 1)];
      const qty = randomInt(10, 100);
      const price = +(randomInt(5, 80) + Math.random()).toFixed(2);
      items.push({
        itemId: inv.id,
        itemName: inv.name,
        quantity: qty,
        unit: inv.unit,
        estimatedPrice: price,
      });
      total += qty * price;
    }
    total = +total.toFixed(2);

    const approvals = [];
    let currentLevel = 1;

    if (status !== 'DRAFT') {
      if (status === 'PENDING_L1') currentLevel = 1;
      else if (status === 'PENDING_L2') currentLevel = 2;
      else if (status === 'PENDING_L3') currentLevel = 3;
      else currentLevel = 3;

      if (currentLevel >= 1 || ['PENDING_L2', 'PENDING_L3', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED'].includes(status)) {
        approvals.push({
          level: 1,
          approved: true,
          approverId: logistics.id,
          approverName: logistics.name,
          comment: '符合采购需求',
          approvedAt: randomDateRecent(20),
        });
      }
      if (['PENDING_L3', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED'].includes(status)) {
        approvals.push({
          level: 2,
          approved: status !== 'REJECTED',
          approverId: moral.id,
          approverName: moral.name,
          comment: status === 'REJECTED' ? '预算过高，需要重新评估' : '同意，请校长审批',
          approvedAt: randomDateRecent(15),
        });
      }
      if (['APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED'].includes(status)) {
        approvals.push({
          level: 3,
          approved: status !== 'REJECTED' && status !== 'CANCELLED',
          approverId: principal.id,
          approverName: principal.name,
          comment: status === 'CANCELLED' ? '已取消' : '同意执行',
          approvedAt: randomDateRecent(10),
        });
      }
    }

    orders.push({
      id: uuid(),
      orderNo: 'PO' + String(202606001 + i),
      title: ['食堂食材采购', '教学用品采购', '实验室试剂采购', '办公耗材采购', '设备维保配件', '体育器材补充', '图书馆新书', '校园绿化苗木'][i % 8] + '·第' + (i + 1) + '批',
      items,
      totalAmount: total,
      status,
      currentLevel: currentLevel,
      createdBy: logistics.id,
      createdAt: randomDateRecent(30),
      approvals,
    });
  }
  return orders;
}

// ==================== 生成校车 ====================
function generateBuses(students, classroomsInfo) {
  const buses = [];
  const plates = ['京A·' + randomInt(10000, 99999), '京B·' + randomInt(10000, 99999), '京C·' + randomInt(10000, 99999), '京D·' + randomInt(10000, 99999), '京E·' + randomInt(10000, 99999)];
  const statuses = ['ON_ROUTE', 'ON_ROUTE', 'AT_SCHOOL', 'AT_STATION', 'DELAYED'];

  for (let i = 0; i < 5; i++) {
    const route = BUS_ROUTES[i];
    const nextStationIdx = randomInt(1, route.stations.length - 1);
    const status = statuses[i];
    const speed = status === 'ON_ROUTE' ? randomInt(25, 55) : (status === 'DELAYED' ? randomInt(5, 20) : 0);
    const occupancy = randomInt(20, 45);
    const onboard = [];

    for (let j = 0; j < Math.min(occupancy, students.length); j++) {
      const stu = students[randomInt(0, students.length - 1)];
      const ci = classroomsInfo.find(c => c.classId === stu.classId);
      onboard.push({
        studentId: stu.id,
        studentName: stu.name,
        grade: stu.grade,
        className: ci ? ci.className : `${stu.grade}年级`,
        parentPhone: randomPhone(),
        boardedAt: todayAt(randomInt(6, 8), randomInt(0, 59)),
        boardStation: route.stations[randomInt(1, route.stations.length - 1)],
      });
    }

    const estArrival = new Date();
    estArrival.setMinutes(estArrival.getMinutes() + randomInt(3, 35));

    buses.push({
      id: uuid(),
      busNumber: '校0' + (i + 1),
      plateNumber: plates[i],
      routeId: route.id,
      routeName: route.name,
      driverName: randomName(0.9),
      driverPhone: randomPhone(),
      capacity: 48,
      currentOccupancy: onboard.length,
      status,
      currentPosition: {
        lat: +(39.9 + randomInt(0, 2000) / 10000).toFixed(6),
        lng: +(116.3 + randomInt(0, 3000) / 10000).toFixed(6),
        timestamp: new Date().toISOString(),
        speed,
        heading: randomInt(0, 359),
      },
      position3D: {
        x: i * 50 + randomInt(-10, 10),
        y: 0,
        z: randomInt(-20, 20),
        rotationY: randomInt(0, 360),
      },
      estimatedArrival: estArrival.toISOString(),
      nextStation: route.stations[nextStationIdx],
      onboardStudents: onboard,
    });
  }
  return buses;
}

// ==================== 生成访客 ====================
function generateVisitors(users, students, classroomsInfo) {
  const visitors = [];
  const relations = ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', '其他亲属', '公务'];
  const purposes = ['看望孩子', '家长会', '送物品', '参加活动', '公务洽谈', '教学交流', '维修服务', '参观学习'];
  const statuses = ['DRAFT', 'PENDING_L1', 'PENDING_L2', 'APPROVED', 'REJECTED', 'APPROVED', 'PENDING_L1', 'APPROVED'];
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'head_teacher');

  for (let i = 0; i < 15; i++) {
    const relation = randomPick(relations);
    const isBusiness = relation === '公务';
    const status = statuses[i % statuses.length];

    let targetType, targetId, targetName, targetLocation, headTeacherId;
    let student;
    if (isBusiness) {
      targetType = Math.random() < 0.5 ? 'TEACHER' : 'OFFICE';
      if (targetType === 'TEACHER') {
        const t = teachers[randomInt(0, teachers.length - 1)];
        targetId = t.id;
        targetName = t.name;
        targetLocation = '行政楼';
      } else {
        targetId = uuid();
        targetName = '教务处';
        targetLocation = '行政楼2层';
      }
    } else {
      student = students[randomInt(0, students.length - 1)];
      targetType = 'STUDENT';
      targetId = student.id;
      targetName = student.name;
      const ci = classroomsInfo.find(c => c.classId === student.classId);
      targetLocation = ci ? `${ci.className}教室` : '教学楼';
      headTeacherId = ci ? ci.headTeacherId : undefined;
    }

    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + randomInt(-3, 7));
    visitDate.setHours(0, 0, 0, 0);

    const startHour = randomInt(8, 16);
    const endHour = startHour + randomInt(1, 3);

    visitors.push({
      id: uuid(),
      visitorName: randomName(isBusiness ? 0.7 : 0.5),
      idCardNo: randomIdCard(),
      phone: randomPhone(),
      relation,
      visitDate: visitDate.toISOString(),
      startTime: String(startHour).padStart(2, '0') + ':00',
      endTime: String(endHour).padStart(2, '0') + ':00',
      purpose: randomPick(purposes),
      targetType,
      targetId,
      targetName,
      targetLocation,
      headTeacherId,
      status,
      qrCodeToken: ['APPROVED', 'PENDING_L2', 'EXECUTED'].includes(status) ? 'QR_' + uuid().toUpperCase().replace(/-/g, '').slice(0, 20) : undefined,
      checkInTime: status === 'EXECUTED' ? visitDate.toISOString().replace('T00:00:00', 'T' + String(startHour).padStart(2, '0') + ':' + String(randomInt(0, 15)).padStart(2, '0') + ':00') : undefined,
      checkOutTime: status === 'EXECUTED' ? visitDate.toISOString().replace('T00:00:00', 'T' + String(endHour - 1).padStart(2, '0') + ':' + String(randomInt(30, 59)).padStart(2, '0') + ':00') : undefined,
      createdAt: randomDateRecent(20),
    });
  }
  return visitors;
}

// ==================== 生成设备 ====================
function generateDevices(classrooms) {
  const devices = [];
  const types = ['PROJECTOR', 'AIR_CONDITION', 'COMPUTER', 'LIGHT', 'BLACKBOARD'];
  const deviceNameMap = {
    'PROJECTOR': '投影仪',
    'AIR_CONDITION': '空调',
    'COMPUTER': '教学电脑',
    'LIGHT': '照明系统',
    'BLACKBOARD': '智能黑板',
  };

  const statuses = ['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'WARNING', 'NORMAL', 'FAULT', 'MAINTENANCE'];

  let deviceCodeCounter = 1;

  for (const cls of classrooms) {
    for (const type of types) {
      const status = randomPick(statuses);
      const now = new Date();
      const lastMaint = new Date(now);
      lastMaint.setDate(lastMaint.getDate() - randomInt(10, 180));
      const nextMaint = new Date(now);
      nextMaint.setDate(nextMaint.getDate() + randomInt(10, 180));

      devices.push({
        id: uuid(),
        deviceCode: 'DEV' + String(deviceCodeCounter).padStart(5, '0'),
        name: `${cls.roomNumber}${deviceNameMap[type]}`,
        type,
        location: `${cls.floor}层${cls.roomNumber}教室`,
        classroomId: cls.id,
        status,
        lastMaintenanceDate: lastMaint.toISOString(),
        nextMaintenanceDate: nextMaint.toISOString(),
        faultDescription: status === 'FAULT' ? randomPick(['灯泡烧坏', '风扇异响', '无法开机', '温度过高', '画面模糊', '遥控器失灵', '滤网堵塞']) : undefined,
        faultTime: status === 'FAULT' ? randomDateRecent(7) : undefined,
        position3D: {
          x: cls.position3D.x + randomInt(-3, 3),
          y: cls.position3D.y + randomInt(1, 3),
          z: cls.position3D.z + randomInt(-3, 3),
          scene: 'teaching',
        },
      });
      deviceCodeCounter++;
    }
  }

  const publicTypes = ['CCTV', 'ACCESS_DOOR', 'FIRE_ALARM', 'CCTV'];
  const publicScenes = ['library', 'canteen', 'dormitory', 'teaching'];
  const publicLocs = ['图书馆入口', '食堂大厅', '宿舍楼下', '教学楼大厅'];
  const publicNames = ['图书馆监控摄像头', '食堂门禁系统', '宿舍火灾报警器', '教学楼中央监控'];

  for (let i = 0; i < 4; i++) {
    const status = i === 2 ? 'MAINTENANCE' : (i === 3 ? 'FAULT' : 'NORMAL');
    const now = new Date();
    const lastMaint = new Date(now);
    lastMaint.setDate(lastMaint.getDate() - randomInt(10, 200));
    const nextMaint = new Date(now);
    nextMaint.setDate(nextMaint.getDate() + randomInt(10, 180));

    devices.push({
      id: uuid(),
      deviceCode: 'DEV' + String(deviceCodeCounter).padStart(5, '0'),
      name: publicNames[i],
      type: publicTypes[i],
      location: publicLocs[i],
      classroomId: undefined,
      status,
      lastMaintenanceDate: lastMaint.toISOString(),
      nextMaintenanceDate: nextMaint.toISOString(),
      faultDescription: status === 'FAULT' ? randomPick(['画面丢失', '网络中断', '烟雾传感器异常', '电磁锁损坏']) : undefined,
      faultTime: status === 'FAULT' ? randomDateRecent(3) : undefined,
      position3D: {
        x: randomInt(10, 100),
        y: randomInt(0, 12),
        z: randomInt(-50, 50),
        scene: publicScenes[i],
      },
    });
    deviceCodeCounter++;
  }

  return devices;
}

// ==================== 生成工单 ====================
function generateWorkOrders(devices, users) {
  const workOrders = [];
  const logistics = users.filter(u => u.role === 'logistics_director');
  const reporters = users.filter(u => ['teacher', 'head_teacher', 'logistics_director'].includes(u.role));
  const statuses = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS'];
  const priorities = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL', 'MEDIUM', 'HIGH', 'MEDIUM'];
  const faultTitles = {
    'PROJECTOR': ['投影仪无法开机', '投影画面模糊', '投影仪灯泡告警', '投影仪风扇异响'],
    'AIR_CONDITION': ['空调制冷效果差', '空调漏水', '空调无法启动', '空调遥控器失灵'],
    'COMPUTER': ['电脑蓝屏死机', '电脑系统卡顿', '电脑无法联网', '电脑显示器无信号'],
    'LIGHT': ['教室灯光闪烁', '多盏灯管不亮', '灯光开关损坏', '照明异常断电'],
    'BLACKBOARD': ['智能黑板触控失灵', '黑板屏幕碎裂', '黑板系统卡顿', '投影无法同步'],
    'CCTV': ['监控画面丢失', '监控夜视失效', '云台无法转动', '存储异常'],
    'ACCESS_DOOR': ['门禁刷卡失效', '门禁电磁锁损坏', '门禁读卡器故障', '门禁系统离线'],
    'FIRE_ALARM': ['烟感误报频繁', '报警器蜂鸣异常', '火警模块离线', '消防主机告警'],
  };

  const faultedDevices = devices.filter(d => d.status === 'FAULT' || d.status === 'MAINTENANCE' || Math.random() < 0.15);
  while (faultedDevices.length < 12) {
    faultedDevices.push(devices[randomInt(0, devices.length - 1)]);
  }

  for (let i = 0; i < 12; i++) {
    const device = faultedDevices[i % faultedDevices.length];
    const reporter = reporters[randomInt(0, reporters.length - 1)];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const title = randomPick(faultTitles[device.type] || ['设备异常', '需要维修检查', '设备故障报修']);

    const createdAt = randomDateRecent(14);
    const created = new Date(createdAt);
    const assigned = new Date(created);
    assigned.setHours(assigned.getHours() + randomInt(1, 24));
    const started = new Date(assigned);
    started.setHours(started.getHours() + randomInt(1, 48));
    const completed = new Date(started);
    completed.setHours(completed.getHours() + randomInt(1, 72));

    const assignee = logistics.length > 0 ? logistics[0] : users.find(u => u.role !== 'student');

    workOrders.push({
      id: uuid(),
      ticketNo: 'WO' + String(202606001 + i),
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type,
      location: device.location,
      reporterId: reporter.id,
      reporterName: reporter.name,
      reporterPhone: reporter.phone,
      faultTitle: title,
      faultDescription: `${device.name}出现故障，${title}。请尽快安排维修。涉及日常教学使用。`,
      faultPhotos: Math.random() < 0.3 ? ['/uploads/wo/' + uuid() + '.jpg', '/uploads/wo/' + uuid() + '.jpg'] : undefined,
      priority,
      status,
      assigneeId: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED'].includes(status) ? assignee.id : undefined,
      assigneeName: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED'].includes(status) ? assignee.name : undefined,
      createdAt,
      assignedAt: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED'].includes(status) ? assigned.toISOString() : undefined,
      startedAt: ['IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED'].includes(status) ? started.toISOString() : undefined,
      completedAt: ['COMPLETED', 'CANCELLED'].includes(status) ? completed.toISOString() : undefined,
      repairNote: ['COMPLETED', 'PENDING_VERIFY'].includes(status) ? (status === 'COMPLETED' ? '已更换损坏部件，设备恢复正常运行。' : '已完成初步修复，等待用户验收。') : undefined,
      repairCost: status === 'COMPLETED' ? +(randomInt(50, 2000) + Math.random()).toFixed(2) : undefined,
      rating: status === 'COMPLETED' && Math.random() < 0.7 ? randomInt(3, 5) : undefined,
    });
  }
  return workOrders;
}

// ==================== 生成日志 ====================
function generateLogs(users) {
  const logs = [];
  const targetNameMap = {
    '用户管理': ['张三', '李老师', '学生列表', '权限配置'],
    '教室管理': ['101教室', '203多媒体室', '教学楼A座', '实验室'],
    '排课系统': ['初一课表', '物理课程', '教室分配方案', '冲突调整'],
    '图书馆': ['A001座位', '图书借阅', '预约记录', '静音区'],
    '食堂管理': ['红烧肉', '1号窗口', '营养统计', '食材入库'],
    '库存管理': ['大米', '食用油', '库存盘点', '安全库存告警'],
    '采购系统': ['PO202606001', '采购审批', '供应商管理', '订单跟踪'],
    '校车管理': ['校01班车', '东线', '司机排班', '学生上下车'],
    '访客系统': ['访客登记', '审批流程', '二维码发放', '出入记录'],
    '设备管理': ['投影仪', '监控系统', '智能黑板', '维护计划'],
    '工单系统': ['WO202606001', '故障报修', '派单处理', '维修验收'],
    '系统设置': ['系统参数', '邮件配置', '数据备份', '日志清理'],
    '权限管理': ['角色配置', '菜单权限', '数据权限', '用户组'],
    '报表统计': ['日报表', '周统计', '月度分析', '考勤报表'],
    '3D可视化': ['场景渲染', '模型加载', '交互配置', '视角切换'],
  };

  const ipPool = Array.from({ length: 50 }, () => 
    `192.168.${randomInt(1, 5)}.${randomInt(2, 254)}`
  );
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/125.0',
  ];

  const userPool = users.filter(u => u.role !== 'student').concat(
    users.filter(u => u.role === 'student').slice(0, 15)
  );

  for (let i = 0; i < 200; i++) {
    const user = userPool[randomInt(0, userPool.length - 1)];
    const module = randomPick(MODULES);
    let action = randomPick(ACTIONS);
    if (module === '采购系统' && Math.random() < 0.4) action = randomPick(['审批通过', '审批驳回']);
    if (module === '工单系统' && Math.random() < 0.4) action = randomPick(['派单', '完成', '报修']);
    
    const status = Math.random() < 0.95 ? 'SUCCESS' : 'FAILURE';
    const moduleTargets = targetNameMap[module] || ['数据'];
    const targetName = randomPick(moduleTargets);

    const now = new Date();
    now.setDate(now.getDate() - randomInt(0, 30));
    now.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));

    logs.push({
      id: uuid(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      targetId: uuid(),
      targetName,
      ipAddress: randomPick(ipPool),
      userAgent: randomPick(userAgents),
      detail: `${user.name}在${module}模块执行【${action}】操作，目标：${targetName}${status === 'FAILURE' ? '，操作失败：' + randomPick(['权限不足', '数据不存在', '网络超时', '参数错误']) : ''}`,
      status,
      createdAt: now.toISOString(),
    });
  }

  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return logs;
}

// ==================== 主函数 ====================
function main() {
  console.log('开始生成Mock数据...');

  const { users, classroomsInfo, teachers } = generateUsers();
  console.log(`✓ users.json: ${users.length} 条`);

  const classrooms = generateClassrooms();
  console.log(`✓ classrooms.json: ${classrooms.length} 条`);

  const courses = generateCourses(teachers, classroomsInfo, classrooms);
  console.log(`✓ courses.json: ${courses.length} 条`);

  const students = users.filter(u => u.role === 'student');
  const librarySeats = generateLibrarySeats(students);
  console.log(`✓ library-seats.json: ${librarySeats.length} 条`);

  const dishes = generateDishes();
  console.log(`✓ dishes.json: ${dishes.length} 条`);

  const inventory = generateInventory();
  console.log(`✓ inventory.json: ${inventory.length} 条`);

  const purchaseOrders = generatePurchaseOrders(inventory, users);
  console.log(`✓ purchase-orders.json: ${purchaseOrders.length} 条`);

  const buses = generateBuses(students, classroomsInfo);
  console.log(`✓ buses.json: ${buses.length} 条`);

  const visitors = generateVisitors(users, students, classroomsInfo);
  console.log(`✓ visitors.json: ${visitors.length} 条`);

  const devices = generateDevices(classrooms);
  console.log(`✓ devices.json: ${devices.length} 条`);

  const workOrders = generateWorkOrders(devices, users);
  console.log(`✓ workorders.json: ${workOrders.length} 条`);

  const logs = generateLogs(users);
  console.log(`✓ logs.json: ${logs.length} 条`);

  const files = {
    'users.json': users,
    'classrooms.json': classrooms,
    'courses.json': courses,
    'library-seats.json': librarySeats,
    'dishes.json': dishes,
    'inventory.json': inventory,
    'purchase-orders.json': purchaseOrders,
    'buses.json': buses,
    'visitors.json': visitors,
    'devices.json': devices,
    'workorders.json': workOrders,
    'logs.json': logs,
  };

  for (const [fname, data] of Object.entries(files)) {
    const fp = path.join(DATA_DIR, fname);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
    const size = (fs.statSync(fp).size / 1024).toFixed(1);
    console.log(`  写入 ${fname} (${size} KB)`);
  }

  console.log('\n所有Mock数据生成完成！');
}

main();
