// PostgreSQL adapter implementation
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { BaseAdapter, DatabaseConfig } from './db-adapter';

neonConfig.webSocketConstructor = ws;

export class PostgreSQLAdapter extends BaseAdapter {
  private pool: Pool | null = null;
  private db: any = null;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      const connectionString = this.config.connectionString || 
        `postgresql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
      
      this.pool = new Pool({ connectionString });
      this.db = drizzle({ client: this.pool, schema });
      
      // Test connection
      await this.pool.query('SELECT 1');
    } catch (error) {
      throw new Error(`PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.query(sql, params);
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.query('SELECT 1');
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        message: "PostgreSQL connection successful",
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "PostgreSQL connection failed"
      };
    }
  }

  getDrizzleDb() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}