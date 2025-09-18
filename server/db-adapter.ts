// Database adapter interface for supporting multiple database types
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  healthCheck(): Promise<{ healthy: boolean; message?: string; latency?: number }>;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'sqlserver';
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  windowsAuth?: boolean;
  connectionString?: string;
  ssl?: boolean;
}

export abstract class BaseAdapter implements DatabaseAdapter {
  protected config: DatabaseConfig;
  protected connection: any;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract query(sql: string, params?: any[]): Promise<any>;
  abstract healthCheck(): Promise<{ healthy: boolean; message?: string; latency?: number }>;
}