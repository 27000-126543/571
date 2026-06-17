import { FileRepository } from './FileRepository.js';
import { generateSeedData } from './seedData.js';
import type {
  User,
  Classroom,
  Course,
  LibrarySeat,
  Reservation,
  Dish,
  InventoryItem,
  PurchaseOrder,
  Bus,
  BusAnomaly,
  Visitor,
  Device,
  WorkOrder,
  OperationLog,
  ScheduleConflict,
} from '../../shared/types.js';

function ensureSeeded<T extends { id: string }>(repo: FileRepository<T>, data: T[]): void {
  if (repo.findAll().length === 0) {
    repo.seed(data);
  }
}

export const userRepository = new FileRepository<User>('users');
export const classroomRepository = new FileRepository<Classroom>('classrooms');
export const courseRepository = new FileRepository<Course>('courses');
export const librarySeatRepository = new FileRepository<LibrarySeat>('library-seats');
export const reservationRepository = new FileRepository<Reservation>('reservations');
export const dishRepository = new FileRepository<Dish>('dishes');
export const inventoryRepository = new FileRepository<InventoryItem>('inventory');
export const purchaseOrderRepository = new FileRepository<PurchaseOrder>('purchase-orders');
export const busRepository = new FileRepository<Bus>('buses');
export const busAnomalyRepository = new FileRepository<BusAnomaly>('bus-anomalies');
export const visitorRepository = new FileRepository<Visitor>('visitors');
export const deviceRepository = new FileRepository<Device>('devices');
export const workOrderRepository = new FileRepository<WorkOrder>('workorders');
export const operationLogRepository = new FileRepository<OperationLog>('operation-logs');
export const scheduleConflictRepository = new FileRepository<ScheduleConflict>('schedule-conflicts');

export function initDataSource(): void {
  const seed = generateSeedData();
  ensureSeeded(userRepository, seed.users);
  ensureSeeded(classroomRepository, seed.classrooms);
  ensureSeeded(courseRepository, seed.courses);
  ensureSeeded(librarySeatRepository, seed.librarySeats);
  ensureSeeded(reservationRepository, seed.reservations);
  ensureSeeded(dishRepository, seed.dishes);
  ensureSeeded(inventoryRepository, seed.inventory);
  ensureSeeded(purchaseOrderRepository, seed.purchaseOrders);
  ensureSeeded(busRepository, seed.buses);
  ensureSeeded(busAnomalyRepository, seed.busAnomalies);
  ensureSeeded(visitorRepository, seed.visitors);
  ensureSeeded(deviceRepository, seed.devices);
  ensureSeeded(workOrderRepository, seed.workOrders);
  ensureSeeded(operationLogRepository, seed.operationLogs);
  ensureSeeded(scheduleConflictRepository, seed.scheduleConflicts);
}

initDataSource();
