import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class FileRepository<T extends { id: string }> {
  private filePath: string;
  private cache: T[] | null = null;

  constructor(private fileName: string) {
    this.filePath = path.join(DATA_DIR, `${fileName}.json`);
  }

  private load(): T[] {
    if (this.cache) return this.cache;
    if (!fs.existsSync(this.filePath)) {
      this.cache = [];
      return this.cache;
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.cache = raw ? JSON.parse(raw) : [];
    } catch {
      this.cache = [];
    }
    return this.cache!;
  }

  private persist(): void {
    if (this.cache) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    }
  }

  findAll(): T[] {
    return [...this.load()];
  }

  findById(id: string): T | undefined {
    return this.load().find((item) => item.id === id);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.load().find(predicate);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.load().filter(predicate);
  }

  create(item: Omit<T, 'id'> & { id?: string }): T {
    const list = this.load();
    const newItem = {
      ...(item as T),
      id: item.id || this.generateId(),
    } as T;
    list.push(newItem);
    this.persist();
    return newItem;
  }

  createMany(items: Array<Omit<T, 'id'> & { id?: string }>): T[] {
    const list = this.load();
    const created = items.map(
      (item) =>
        ({
          ...(item as T),
          id: item.id || this.generateId(),
        }) as T,
    );
    list.push(...created);
    this.persist();
    return created;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const list = this.load();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data, id } as T;
    this.persist();
    return list[idx];
  }

  delete(id: string): boolean {
    const list = this.load();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.persist();
    return true;
  }

  upsert(item: T): T {
    const existing = this.findById(item.id);
    if (existing) {
      return this.update(item.id, item) as T;
    }
    return this.create(item as unknown as Omit<T, 'id'> & { id?: string });
  }

  clear(): void {
    this.cache = [];
    this.persist();
  }

  seed(data: T[]): void {
    this.cache = [...data];
    this.persist();
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
