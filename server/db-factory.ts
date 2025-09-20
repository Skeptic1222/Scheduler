// Database factory for creating the appropriate database adapter
import { PostgreSQLAdapter } from './db-postgresql';
import { SQLServerAdapter } from './db-sqlserver';
import { DatabaseAdapter, DatabaseConfig } from './db-adapter';

export class DatabaseFactory {
  static createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'postgresql':
        return new PostgreSQLAdapter(config);
      case 'sqlserver':
        return new SQLServerAdapter(config);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  static getConfigFromEnv(): DatabaseConfig {
    const dbType = (process.env.DB_TYPE || 'postgresql') as 'postgresql' | 'sqlserver';
    
    if (dbType === 'sqlserver') {
      return {
        type: 'sqlserver',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '1433'),
        database: process.env.DB_NAME || 'HospitalScheduler',
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        windowsAuth: process.env.DB_WINDOWS_AUTH === 'true',
        ssl: process.env.DB_SSL === 'true'
      };
    } else {
      // PostgreSQL (default for all deployments)
      return {
        type: 'postgresql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'main',
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true'
      };
    }
  }
}