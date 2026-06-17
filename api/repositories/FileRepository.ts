import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')

export class FileRepository<T extends { id: string }> {
  private readonly filePath: string
  private items: T[] = []
  private loaded = false

  constructor(private readonly fileName: string) {
    this.filePath = path.join(DATA_DIR, `${fileName}.json`)
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(DATA_DIR)
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true })
    }
  }

  async load(): Promise<void> {
    if (this.loaded) return
    await this.ensureDataDir()
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8')
      this.items = JSON.parse(raw) as T[]
    } catch (err) {
      const error = err as NodeJS.ErrnoException
      if (error.code === 'ENOENT') {
        this.items = []
        await this.persist()
      } else {
        throw new Error(`加载文件 ${this.fileName} 失败: ${error.message}`)
      }
    }
    this.loaded = true
  }

  private async persist(): Promise<void> {
    await this.ensureDataDir()
    await fs.writeFile(this.filePath, JSON.stringify(this.items, null, 2), 'utf-8')
  }

  async save(): Promise<void> {
    await this.persist()
  }

  async findAll(): Promise<T[]> {
    await this.load()
    return [...this.items]
  }

  async findById(id: string): Promise<T | null> {
    await this.load()
    return this.items.find(item => item.id === id) ?? null
  }

  async create(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    await this.load()
    const newItem = {
      ...item,
      id: item.id ?? crypto.randomUUID(),
    } as T
    this.items.push(newItem)
    await this.persist()
    return newItem
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    await this.load()
    const index = this.items.findIndex(item => item.id === id)
    if (index === -1) return null
    const updated = { ...this.items[index], ...patch, id } as T
    this.items[index] = updated
    await this.persist()
    return updated
  }

  async delete(id: string): Promise<boolean> {
    await this.load()
    const initialLength = this.items.length
    this.items = this.items.filter(item => item.id !== id)
    if (this.items.length === initialLength) return false
    await this.persist()
    return true
  }

  async query(filterFn: (item: T) => boolean): Promise<T[]> {
    await this.load()
    return this.items.filter(filterFn)
  }

  async count(): Promise<number> {
    await this.load()
    return this.items.length
  }

  async exists(id: string): Promise<boolean> {
    await this.load()
    return this.items.some(item => item.id === id)
  }
}
