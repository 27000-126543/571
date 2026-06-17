export type UserRole =
  | 'student'
  | 'teacher'
  | 'head_teacher'
  | 'logistics_director'
  | 'moral_director'
  | 'principal'
  | 'parent';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  avatar?: string;
  grade?: number;
  classId?: string;
  employeeId?: string;
  phone?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: 0 | number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ApprovalStatus =
  | 'DRAFT'
  | 'PENDING_L1'
  | 'PENDING_L2'
  | 'PENDING_L3'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'CANCELLED';

export interface LoginRequest {
  username: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
  permissions: string[];
}

export type EquipmentType = 'projector' | 'blackboard' | 'computer' | 'lab' | 'music' | 'art';

export interface Course {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  grade: number;
  classId: string;
  classroomId?: string;
  startTime: string;
  endTime: string;
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  requiredEquipment?: EquipmentType[];
  priority: number;
}

export interface Classroom {
  id: string;
  buildingId: string;
  floor: number;
  roomNumber: string;
  capacity: number;
  occupiedSeats: number;
  equipment: EquipmentType[];
  currentCourse?: Course;
  sensors: {
    temperature: number;
    humidity: number;
    illuminance: number;
  };
  position3D: { x: number; y: number; z: number; floorHeight: number };
}

export interface ScheduleConflict {
  id: string;
  classroomId: string;
  classroomNumber: string;
  timeSlot: string;
  courses: {
    courseId: string;
    courseName: string;
    grade: number;
    className: string;
    teacherName: string;
    priority: number;
  }[];
  resolved: boolean;
  resolvedBy?: string;
}

export interface AllocationResult {
  totalCourses: number;
  allocatedCourses: number;
  conflicts: ScheduleConflict[];
  autoAdjusted: number;
  timetable: Course[];
}

export interface NavPath {
  from: string;
  to: string;
  waypoints: { x: number; y: number; z: number }[];
  distance: number;
  estimatedTime: number;
}

export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE';

export interface LibrarySeat {
  id: string;
  seatNumber: string;
  zone: 'A安静区' | 'B讨论区' | 'C电子阅览区' | 'D靠窗区';
  status: SeatStatus;
  position3D: { x: number; y: number; z: number };
  currentStudentId?: string;
  currentStudentName?: string;
  reservedUntil?: string;
  checkedInAt?: string;
  usedMinutesToday: number;
}

export interface Reservation {
  id: string;
  seatId: string;
  seatNumber: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  checkInStatus: 'PENDING' | 'CHECKED_IN' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  sodium?: number;
}

export interface Dish {
  id: string;
  name: string;
  windowId: string;
  windowName: string;
  category: '主食' | '热菜' | '凉菜' | '汤羹' | '小吃' | '饮品';
  price: number;
  nutrition: Nutrition;
  ingredients: string[];
  allergens?: ('花生' | '海鲜' | '蛋奶' | '麸质' | '坚果')[];
  soldToday: number;
  remainingServings: number;
  position3D: { x: number; y: number; z: number };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: '蔬菜' | '肉类' | '米面' | '调料' | '油料' | '冻品';
  unit: string;
  currentStock: number;
  safetyThreshold: number;
  dailyConsumption: number;
  lastPurchasedAt: string;
  supplierName: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  title: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
  }[];
  totalAmount: number;
  status: ApprovalStatus;
  currentLevel: 1 | 2 | 3;
  createdBy: string;
  createdAt: string;
  approvals: {
    level: 1 | 2 | 3;
    approved: boolean;
    approverId?: string;
    approverName?: string;
    comment?: string;
    approvedAt?: string;
  }[];
}

export interface Bus {
  id: string;
  busNumber: string;
  plateNumber: string;
  routeId: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  currentOccupancy: number;
  status: 'ON_ROUTE' | 'AT_STATION' | 'AT_SCHOOL' | 'MAINTENANCE' | 'DELAYED';
  currentPosition: {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
    heading: number;
  };
  position3D: { x: number; y: number; z: number; rotationY: number };
  estimatedArrival: string;
  nextStation: string;
  onboardStudents: {
    studentId: string;
    studentName: string;
    grade: number;
    className: string;
    parentPhone: string;
    boardedAt: string;
    boardStation: string;
  }[];
}

export interface BusAnomaly {
  id: string;
  busId: string;
  busNumber: string;
  type: 'DELAY_OVER_15MIN' | 'STUDENT_MISSING' | 'ROUTE_DEVIATION' | 'ACCIDENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  notifiedParents: { studentName: string; phone: string; notifiedAt: string }[];
  notifiedTeachers: { teacherName: string; phone: string; notifiedAt: string }[];
  status: 'PENDING' | 'HANDLING' | 'RESOLVED';
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

export type VisitorRelation = '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他亲属' | '公务';

export interface Visitor {
  id: string;
  visitorName: string;
  idCardNo: string;
  phone: string;
  avatar?: string;
  relation: VisitorRelation;
  visitDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  targetType: 'STUDENT' | 'TEACHER' | 'OFFICE';
  targetId: string;
  targetName: string;
  targetLocation?: string;
  headTeacherId?: string;
  status: ApprovalStatus;
  qrCodeToken?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  path?: NavPath;
}

export type DeviceType =
  | 'PROJECTOR'
  | 'AIR_CONDITION'
  | 'COMPUTER'
  | 'LIGHT'
  | 'BLACKBOARD'
  | 'CCTV'
  | 'ACCESS_DOOR'
  | 'FIRE_ALARM';

export interface Device {
  id: string;
  deviceCode: string;
  name: string;
  type: DeviceType;
  location: string;
  classroomId?: string;
  status: 'NORMAL' | 'WARNING' | 'FAULT' | 'MAINTENANCE';
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  faultDescription?: string;
  faultTime?: string;
  position3D: { x: number; y: number; z: number; scene: 'teaching' | 'library' | 'canteen' | 'dormitory' };
}

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_VERIFY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WorkOrder {
  id: string;
  ticketNo: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  location: string;
  reporterId: string;
  reporterName: string;
  reporterPhone?: string;
  faultTitle: string;
  faultDescription: string;
  faultPhotos?: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: TicketStatus;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  repairNote?: string;
  repairCost?: number;
  rating?: 1 | 2 | 3 | 4 | 5;
}

export interface DailyReport {
  reportDate: string;
  generatedAt: string;
  schoolName: string;
  attendance: {
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    attendanceRate: number;
    byGrade: { grade: number; className: string; total: number; present: number; rate: number }[];
  };
  canteen: {
    totalMealsServed: number;
    totalRevenue: number;
    topDishes: { dishName: string; sold: number; revenue: number }[];
    consumption: { ingredientName: string; used: number; unit: string }[];
    lowStockAlerts: { itemName: string; current: number; threshold: number }[];
  };
  devices: {
    totalDevices: number;
    normalCount: number;
    faultCount: number;
    newTickets: number;
    completedTickets: number;
    avgRepairHours: number;
    byType: { type: DeviceType; total: number; fault: number }[];
  };
  events: {
    busAnomalies: number;
    visitorCount: number;
    emergencyCount: number;
    emergencyDetails: { type: string; time: string; description: string; status: string }[];
  };
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  targetId?: string;
  targetName?: string;
  ipAddress: string;
  userAgent?: string;
  detail?: string;
  status: 'SUCCESS' | 'FAILURE';
  createdAt: string;
}

export interface KpiStats {
  totalStudents: number;
  presentToday: number;
  attendanceRate: number;
  classroomUsageRate: number;
  canteenMealsToday: number;
  onlineBuses: number;
  pendingTickets: number;
  pendingApprovals: number;
  criticalAlerts: number;
}

export interface AlertItem {
  id: string;
  type: 'DEVICE_FAULT' | 'BUS_ANOMALY' | 'STOCK_LOW' | 'APPROVAL_TODO' | 'CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  time: string;
  link?: string;
  handled: boolean;
}
