import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { body, validationResult } from "express-validator";
import { storage } from "./storage";
import { z } from "zod";

import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Google OAuth verification
async function verifyGoogleToken(token: string): Promise<any> {
  try {
    // In production, verify with Google's tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!response.ok) throw new Error('Invalid token');
    return await response.json();
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

// Auth middleware
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const userData = await verifyGoogleToken(token);
    let user = await storage.getUserByEmail(userData.email);
    
    if (!user) {
      // Create user if doesn't exist
      user = await storage.createUser({
        email: userData.email,
        name: userData.name,
        role: 'staff' // Default role
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// FCFS Algorithm
function calculateFCFSScore(user: any, shift: any): number {
  let score = 0;
  
  // Seniority (30%)
  score += (user.seniority_years || 0) * 3;
  
  // Last shift worked (20%) - more points for longer time since last shift
  if (user.last_shift_date) {
    const daysSinceLastShift = Math.floor(
      (Date.now() - new Date(user.last_shift_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.min(daysSinceLastShift * 0.2, 20);
  } else {
    score += 20; // Never worked a shift
  }
  
  // Skill match (25%)
  const userSkills = user.skills || [];
  const requiredSkills = shift.required_skills || [];
  const matchingSkills = userSkills.filter((skill: string) => 
    requiredSkills.includes(skill)
  ).length;
  if (requiredSkills.length > 0) {
    score += (matchingSkills / requiredSkills.length) * 25;
  }
  
  // Availability (25%) - assume available for now
  score += 25;
  
  return Math.round(score * 100) / 100;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          // Authenticate WebSocket connection
          const user = await verifyGoogleToken(data.token);
          (ws as any).user = user;
          ws.send(JSON.stringify({ type: 'auth_success', user }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Health check
  app.get('/api/health', async (req, res) => {
    const dbHealth = await storage.healthCheck();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  });

  // Auth routes
  app.post('/api/auth/verify', [
    body('token').notEmpty().withMessage('Token is required')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;
      const userData = await verifyGoogleToken(token);
      let user = await storage.getUserByEmail(userData.email);
      
      if (!user) {
        user = await storage.createUser({
          email: userData.email,
          name: userData.name,
          role: 'staff'
        });
      }

      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // User routes
  app.get('/api/users/me', requireAuth, async (req: any, res) => {
    res.json({ user: req.user });
  });

  app.put('/api/users/me', requireAuth, [
    body('name').optional().isLength({ min: 1 }),
    body('department_id').optional().isUUID(),
    body('skills').optional().isArray()
  ], async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = req.body;
      const user = await storage.updateUser(req.user.id, updates);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Department routes
  app.get('/api/departments', requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json({ departments });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  });

  app.post('/api/departments', requireAuth, [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional()
  ], async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const department = await storage.createDepartment(req.body);
      res.status(201).json({ department });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create department' });
    }
  });

  // Shift routes
  app.get('/api/shifts', requireAuth, async (req: any, res) => {
    try {
      const { status, department_id, start_date, end_date } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (department_id) filters.department_id = department_id as string;
      if (start_date) filters.start_date = new Date(start_date as string);
      if (end_date) filters.end_date = new Date(end_date as string);

      const shifts = await storage.getShifts(filters);
      res.json({ shifts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch shifts' });
    }
  });

  app.post('/api/shifts', requireAuth, [
    body('title').notEmpty().withMessage('Title is required'),
    body('department_id').isUUID().withMessage('Valid department ID required'),
    body('start_time').isISO8601().withMessage('Valid start time required'),
    body('end_time').isISO8601().withMessage('Valid end time required'),
    body('required_skills').optional().isArray(),
    body('min_experience_years').optional().isInt({ min: 0 })
  ], async (req: any, res) => {
    try {
      // Check if user can create shifts (admin or supervisor)
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const shiftData = {
        ...req.body,
        created_by: req.user.id,
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
      };

      const shift = await storage.createShift(shiftData);

      // Add eligible staff to FCFS queue
      const eligibleUsers = await storage.getShifts(); // Get all users (simplified)
      // In reality, filter by department, skills, etc.
      
      // Create audit log
      await storage.createAuditLog({
        user_id: req.user.id,
        action: 'CREATE_SHIFT',
        resource_type: 'shift',
        resource_id: shift.id,
        details: { shift_title: shift.title }
      });

      // Broadcast to connected clients
      broadcast({
        type: 'shift_created',
        shift
      });

      res.status(201).json({ shift });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create shift' });
    }
  });

  // FCFS Queue routes
  app.get('/api/fcfs-queue', requireAuth, async (req: any, res) => {
    try {
      const { shift_id } = req.query;
      const queue = await storage.getFcfsQueue(shift_id as string);
      res.json({ queue });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch FCFS queue' });
    }
  });

  app.post('/api/fcfs-queue/respond', requireAuth, [
    body('queue_id').isUUID().withMessage('Valid queue ID required'),
    body('response').isIn(['accept', 'decline']).withMessage('Response must be accept or decline')
  ], async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { queue_id, response } = req.body;
      
      const queueEntry = await storage.updateFcfsQueueEntry(queue_id, {
        status: response === 'accept' ? 'accepted' : 'declined'
      });

      if (response === 'accept') {
        // Update shift to assign user
        const shift = await storage.getShift(queueEntry.shift_id);
        if (shift) {
          await storage.updateShift(shift.id, {
            status: 'assigned',
            assigned_user_id: req.user.id
          });
        }
      }

      // Create audit log
      await storage.createAuditLog({
        user_id: req.user.id,
        action: `FCFS_${response.toUpperCase()}`,
        resource_type: 'fcfs_queue',
        resource_id: queue_id,
        details: { response }
      });

      // Broadcast update
      broadcast({
        type: 'fcfs_response',
        queue_entry: queueEntry,
        response
      });

      res.json({ success: true, queue_entry: queueEntry });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process response' });
    }
  });

  // Notifications routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const { unread_only } = req.query;
      const notifications = await storage.getUserNotifications(
        req.user.id, 
        unread_only === 'true'
      );
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Admin routes
  app.get('/api/admin/settings', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const dbHealth = await storage.healthCheck();
      
      res.json({
        database: {
          type: 'PostgreSQL',
          status: dbHealth.healthy ? 'connected' : 'disconnected',
          latency: dbHealth.latency || null
        },
        realtime: {
          status: 'active',
          connections: wss.clients.size
        },
        fcfs: {
          status: 'operational'
        },
        auth: {
          provider: 'Google OAuth',
          status: 'active'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin settings' });
    }
  });

  return httpServer;
}
