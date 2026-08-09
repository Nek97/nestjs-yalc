import { Seeder } from 'typeorm-seeding';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

export interface DbConfType extends MysqlConnectionOptions {
  factories?: string[];
  seeds?: { new (): Seeder }[];
}

export interface DbConfObject {
  (): DbConfType;
  connName: string;
  dbName: string;
}
