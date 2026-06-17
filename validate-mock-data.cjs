const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function validate() {
  console.log('==== Mock数据验证报告 ====\n');

  const fileValidations = [
    {
      file: 'users.json',
      minCount: 60,
      validations: [
        { name: '用户数≥60', check: (d) => d.length >= 60 },
        { name: '学生数=48', check: (d) => d.filter(u => u.role === 'student').length === 48 },
        { name: '教师数≥12', check: (d) => d.filter(u => ['teacher', 'head_teacher'].includes(u.role)).length >= 12 },
        { name: '主任角色齐全', check: (d) => {
            const roles = d.map(u => u.role);
            return roles.includes('logistics_director') && roles.includes('moral_director') && roles.includes('principal');
        }},
        { name: '含家长角色', check: (d) => d.some(u => u.role === 'parent') },
        { name: '年级7-12齐全', check: (d) => {
            const grades = new Set(d.filter(u => u.role === 'student').map(u => u.grade));
            return [7,8,9,10,11,12].every(g => grades.has(g));
        }},
        { name: 'passwordHash一致', check: (d) => d.every(u => u.passwordHash === d[0].passwordHash) },
        { name: 'id为UUID格式', check: (d) => d.every(u => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(u.id)) },
      ]
    },
    {
      file: 'classrooms.json',
      minCount: 24,
      validations: [
        { name: '教室数=24', check: (d) => d.length === 24 },
        { name: '4层楼各6间', check: (d) => {
            const counts = [1,2,3,4].map(f => d.filter(c => c.floor === f).length);
            return counts.every(c => c === 6);
        }},
        { name: '含sensors数据', check: (d) => d.every(c => c.sensors && typeof c.sensors.temperature === 'number') },
        { name: 'position3D完整', check: (d) => d.every(c => 'x' in c.position3D && 'y' in c.position3D && 'floorHeight' in c.position3D) },
        { name: '含基础设备', check: (d) => d.every(c => c.equipment.length >= 3) },
      ]
    },
    {
      file: 'courses.json',
      minCount: 180,
      validations: [
        { name: '课程数≥180', check: (d) => d.length >= 180 },
        { name: 'weekday为1-5', check: (d) => d.every(c => c.weekday >= 1 && c.weekday <= 5) },
        { name: 'grade为7-12', check: (d) => d.every(c => c.grade >= 7 && c.grade <= 12) },
        { name: 'priority=grade', check: (d) => d.every(c => c.priority === c.grade) },
        { name: 'startTime格式HH:MM', check: (d) => d.every(c => /^\d{2}:\d{2}$/.test(c.startTime)) },
        { name: '含teacherId和teacherName', check: (d) => d.every(c => c.teacherId && c.teacherName) },
      ]
    },
    {
      file: 'library-seats.json',
      minCount: 80,
      validations: [
        { name: '座位数=80', check: (d) => d.length === 80 },
        { name: '4区各20座', check: (d) => {
            const zones = ['A安静区', 'B讨论区', 'C电子阅览区', 'D靠窗区'];
            return zones.every(z => d.filter(s => s.zone === z).length === 20);
        }},
        { name: '状态混合', check: (d) => {
            const s = new Set(d.map(x => x.status));
            return s.has('AVAILABLE') && (s.has('RESERVED') || s.has('IN_USE'));
        }},
        { name: 'IN_USE有学生信息', check: (d) => d.filter(s => s.status === 'IN_USE').every(s => s.currentStudentId) },
      ]
    },
    {
      file: 'dishes.json',
      minCount: 30,
      validations: [
        { name: '菜品数=30', check: (d) => d.length === 30 },
        { name: '6窗口各≥5道', check: (d) => {
            const windowIds = [...new Set(d.map(x => x.windowId))];
            return windowIds.length === 6 && windowIds.every(wid => d.filter(x => x.windowId === wid).length >= 5);
        }},
        { name: '含营养成分', check: (d) => d.every(x => x.nutrition && x.nutrition.calories) },
        { name: '含ingredients', check: (d) => d.every(x => Array.isArray(x.ingredients)) },
        { name: '价格合理', check: (d) => d.every(x => x.price >= 1 && x.price <= 20) },
      ]
    },
    {
      file: 'inventory.json',
      minCount: 40,
      validations: [
        { name: '食材数=40', check: (d) => d.length === 40 },
        { name: '20%处于WARNING/CRITICAL', check: (d) => {
            const warn = d.filter(x => x.status !== 'NORMAL').length;
            return warn >= 4 && warn <= 16;
        }},
        { name: '6大分类齐全', check: (d) => {
            const cats = new Set(d.map(x => x.category));
            return ['蔬菜', '肉类', '米面', '调料', '油料', '冻品'].every(c => cats.has(c));
        }},
        { name: 'dailyConsumption>0', check: (d) => d.every(x => x.dailyConsumption > 0) },
        { name: '含supplierName', check: (d) => d.every(x => x.supplierName) },
      ]
    },
    {
      file: 'purchase-orders.json',
      minCount: 8,
      validations: [
        { name: '采购单数=8', check: (d) => d.length === 8 },
        { name: '审批状态齐全', check: (d) => {
            const statuses = new Set(d.map(x => x.status));
            const required = ['DRAFT', 'PENDING_L1', 'PENDING_L2', 'PENDING_L3', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED'];
            return required.every(s => statuses.has(s));
        }},
        { name: '含items数组', check: (d) => d.every(x => Array.isArray(x.items) && x.items.length > 0) },
        { name: 'totalAmount>0', check: (d) => d.every(x => x.totalAmount > 0) },
        { name: '含approvals数组', check: (d) => d.every(x => Array.isArray(x.approvals)) },
      ]
    },
    {
      file: 'buses.json',
      minCount: 5,
      validations: [
        { name: '校车数=5', check: (d) => d.length === 5 },
        { name: '状态混合', check: (d) => new Set(d.map(b => b.status)).size >= 3 },
        { name: '位置信息完整', check: (d) => d.every(b => b.currentPosition && typeof b.currentPosition.lat === 'number') },
        { name: 'position3D含rotationY', check: (d) => d.every(b => 'rotationY' in b.position3D) },
        { name: '乘车学生列表', check: (d) => d.every(b => Array.isArray(b.onboardStudents)) },
      ]
    },
    {
      file: 'visitors.json',
      minCount: 15,
      validations: [
        { name: '访客数=15', check: (d) => d.length === 15 },
        { name: '审批状态混合', check: (d) => new Set(d.map(v => v.status)).size >= 3 },
        { name: '含公务/亲属两类', check: (d) => d.some(v => v.relation === '公务') && d.some(v => v.relation !== '公务') },
        { name: 'targetType多样', check: (d) => new Set(d.map(v => v.targetType)).size >= 2 },
        { name: '含idCardNo', check: (d) => d.every(v => v.idCardNo && v.idCardNo.length >= 15) },
      ]
    },
    {
      file: 'devices.json',
      minCount: 124,
      validations: [
        { name: '设备数=124', check: (d) => d.length === 124 },
        { name: '含FAULT/MAINTENANCE', check: (d) => d.some(x => x.status === 'FAULT') && d.some(x => x.status === 'MAINTENANCE') },
        { name: '设备类型多样', check: (d) => new Set(d.map(x => x.type)).size >= 6 },
        { name: '公共区域设备', check: (d) => d.filter(x => !x.classroomId).length === 4 },
        { name: '含position3D.scene', check: (d) => d.every(x => 'scene' in x.position3D) },
        { name: '含nextMaintenanceDate', check: (d) => d.every(x => x.nextMaintenanceDate) },
      ]
    },
    {
      file: 'workorders.json',
      minCount: 12,
      validations: [
        { name: '工单数=12', check: (d) => d.length === 12 },
        { name: '工单状态多样', check: (d) => new Set(d.map(w => w.status)).size >= 4 },
        { name: '优先级含CRITICAL/HIGH', check: (d) => d.some(w => w.priority === 'CRITICAL') && d.some(w => w.priority === 'HIGH') },
        { name: 'completedAt匹配状态', check: (d) => d.filter(w => ['COMPLETED', 'CANCELLED'].includes(w.status)).every(w => w.completedAt) },
        { name: 'assignee匹配状态', check: (d) => d.filter(w => ['ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFY', 'COMPLETED'].includes(w.status)).every(w => w.assigneeId) },
      ]
    },
    {
      file: 'logs.json',
      minCount: 200,
      validations: [
        { name: '日志数=200', check: (d) => d.length === 200 },
        { name: 'SUCCESS/FAILURE混合', check: (d) => d.filter(x => x.status === 'SUCCESS').length >= 180 && d.some(x => x.status === 'FAILURE') },
        { name: '模块覆盖≥10', check: (d) => new Set(d.map(x => x.module)).size >= 10 },
        { name: '按时间倒序', check: (d) => d.every((x, i) => i === 0 || new Date(x.createdAt) <= new Date(d[i-1].createdAt)) },
        { name: '含userRole', check: (d) => d.every(x => x.userRole) },
        { name: '含ipAddress', check: (d) => d.every(x => x.ipAddress && /^\d+\.\d+\.\d+\.\d+$/.test(x.ipAddress)) },
      ]
    },
  ];

  let totalPassed = 0;
  let totalChecks = 0;

  for (const fv of fileValidations) {
    const fp = path.join(DATA_DIR, fv.file);
    const size = (fs.statSync(fp).size / 1024).toFixed(1);
    const content = JSON.parse(fs.readFileSync(fp, 'utf-8'));

    console.log(`📄 ${fv.file} (${size} KB, ${content.length} 条记录)`);

    let filePassed = 0;
    for (const v of fv.validations) {
      totalChecks++;
      const passed = v.check(content);
      if (passed) {
        filePassed++;
        totalPassed++;
        console.log(`   ✅ ${v.name}`);
      } else {
        console.log(`   ❌ ${v.name} —— 未通过`);
      }
    }
    console.log(`   通过率: ${filePassed}/${fv.validations.length}\n`);
  }

  console.log('==== 总结 ====');
  console.log(`总检查项: ${totalChecks}`);
  console.log(`通过: ${totalPassed}`);
  console.log(`未通过: ${totalChecks - totalPassed}`);
  console.log(`总通过率: ${((totalPassed / totalChecks) * 100).toFixed(1)}%`);

  if (totalPassed === totalChecks) {
    console.log('\n🎉 所有检查项均通过！数据质量符合要求。');
  }
}

validate();
