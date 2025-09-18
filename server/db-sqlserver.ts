// SQL Server adapter implementation
import sql from 'mssql';
import { BaseAdapter, DatabaseConfig } from './db-adapter';

export class SQLServerAdapter extends BaseAdapter {
  private pool: sql.ConnectionPool | null = null;
  private poolRequest: sql.Request | null = null;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      const sqlConfig: sql.config = {
        server: this.config.host,
        port: this.config.port || 1433,
        database: this.config.database,
        options: {
          encrypt: this.config.ssl || false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        requestTimeout: 30000,
        connectionTimeout: 30000,
      };

      // Configure authentication
      if (this.config.windowsAuth) {
        // Windows Authentication requires proper domain credentials for NTLM
        if (!this.config.username || !this.config.username.includes('\\')) {
          throw new Error('Windows Authentication requires username in DOMAIN\\User format');
        }
        if (!this.config.password) {
          throw new Error('Windows Authentication requires password for NTLM');
        }
        
        const [domain, userName] = this.config.username.split('\\');
        sqlConfig.authentication = {
          type: 'ntlm',
          options: {
            domain: domain,
            userName: userName,
            password: this.config.password
          }
        };
        // Remove user/password from root config when using NTLM
        delete sqlConfig.user;
        delete sqlConfig.password;
      } else if (this.config.username && this.config.password) {
        // SQL Server authentication (recommended for production)
        sqlConfig.user = this.config.username;
        sqlConfig.password = this.config.password;
      } else {
        throw new Error('Database authentication not configured - set DB_USER/DB_PASSWORD or DB_WINDOWS_AUTH with domain credentials');
      }

      this.pool = new sql.ConnectionPool(sqlConfig);
      await this.pool.connect();
      this.poolRequest = this.pool.request();
      
      // Test connection
      await this.query('SELECT 1 as test');
    } catch (error) {
      throw new Error(`SQL Server connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.poolRequest = null;
    }
  }

  async query(sqlQuery: string, params?: any[]): Promise<any> {
    if (!this.pool || !this.poolRequest) {
      throw new Error('Database not connected');
    }

    try {
      // Create a new request for each query to avoid conflicts
      const request = this.pool.request();
      
      // Add parameters if provided
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
        
        // Replace ? placeholders with @param0, @param1, etc.
        let parameterizedQuery = sqlQuery;
        let paramIndex = 0;
        parameterizedQuery = parameterizedQuery.replace(/\?/g, () => `@param${paramIndex++}`);
        
        const result = await request.query(parameterizedQuery);
        return result;
      } else {
        const result = await request.query(sqlQuery);
        return result;
      }
    } catch (error) {
      throw new Error(`SQL Server query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.query('SELECT 1 as test');
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        message: "SQL Server connection successful",
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "SQL Server connection failed"
      };
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool;
  }

  // Convert PostgreSQL-style queries to SQL Server format
  convertQuery(pgQuery: string): string {
    return pgQuery
      // Replace gen_random_uuid() with NEWID()
      .replace(/gen_random_uuid\(\)/g, 'NEWID()')
      // Replace CURRENT_TIMESTAMP with GETDATE()
      .replace(/CURRENT_TIMESTAMP/g, 'GETDATE()')
      // Replace JSONB with NVARCHAR(MAX)
      .replace(/JSONB/g, 'NVARCHAR(MAX)')
      // Replace boolean true/false with 1/0
      .replace(/\btrue\b/g, '1')
      .replace(/\bfalse\b/g, '0');
  }
}