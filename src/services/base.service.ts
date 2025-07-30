import { Repository, FindOptionsWhere, FindManyOptions, ObjectLiteral } from 'typeorm';

export abstract class BaseService<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findById(id: number | string): Promise<T | null> {
    return await this.repository.findOne({ where: { id } as any });
  }

  async create(data: any): Promise<T> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async update(id: number, data: any): Promise<T | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as any });
    return count > 0;
  }
} 