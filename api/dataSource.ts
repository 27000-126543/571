import { FileRepository } from './repositories/FileRepository.js'
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
} from '../shared/types.js'

class DataSource {
  private static instance: DataSource | null = null
  private initialized = false

  public readonly users = new FileRepository<User>('users')
  public readonly classrooms = new FileRepository<Classroom>('classrooms')
  public readonly courses = new FileRepository<Course>('courses')
  public readonly seats = new FileRepository<LibrarySeat>('seats')
  public readonly reservations = new FileRepository<Reservation>('reservations')
  public readonly dishes = new FileRepository<Dish>('dishes')
  public readonly inventory = new FileRepository<InventoryItem>('inventory')
  public readonly purchaseOrders = new FileRepository<PurchaseOrder>('purchaseOrders')
  public readonly buses = new FileRepository<Bus>('buses')
  public readonly busAnomalies = new FileRepository<BusAnomaly>('busAnomalies')
  public readonly visitors = new FileRepository<Visitor>('visitors')
  public readonly devices = new FileRepository<Device>('devices')
  public readonly workOrders = new FileRepository<WorkOrder>('workOrders')
  public readonly logs = new FileRepository<OperationLog>('logs')

  private constructor() {}

  static getInstance(): DataSource {
    if (!DataSource.instance) {
      DataSource.instance = new DataSource()
    }
    return DataSource.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const repositories = [
      this.users,
      this.classrooms,
      this.courses,
      this.seats,
      this.reservations,
      this.dishes,
      this.inventory,
      this.purchaseOrders,
      this.buses,
      this.busAnomalies,
      this.visitors,
      this.devices,
      this.workOrders,
      this.logs,
    ]

    await Promise.all(repositories.map(repo => repo.load()))

    this.initialized = true
    console.log('[DataSource] 所有仓储已初始化')
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const dataSource = DataSource.getInstance()
export default DataSource
