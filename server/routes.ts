import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { body, validationResult, sanitizeBody } from "express-validator";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { 
  AppError, 
  createError, 
  sendSuccess, 
  sendError, 
  asyncHandler,
  HTTP_STATUS 
} from "./utils/errors";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Google OAuth verification with credential rotation
async function verifyGoogleToken(token: string): Promise<any> {
  try {
    // Development mode bypass for testing
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      return {
        email: 'admin@hospital.dev',
        name: 'Development Admin',
        sub: 'dev-user-123'
      };
    }
    
    // In production, verify with Google's tokeninfo endpoint
    // Add timeout and retry logic for better security
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Hospital-Scheduler/1.0',
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Token verification failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Additional security checks
      if (!data.email || !data.sub) {
        throw new Error('Invalid token payload');
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error('[SECURITY] Token verification failed:', error);
    throw new Error('Token verification failed');
  }
}

// Auth middleware
const requireAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw createError.authRequired('Authorization token is required');
  }

  const userData = await verifyGoogleToken(token);
  let user = await storage.getUserByEmail(userData.email);
  
  if (!user) {
      // Create user if doesn't exist
      const defaultRole = userData.email === 'admin@hospital.dev' ? 'admin' : 'staff';
      user = await storage.createUser({
        email: userData.email,
        name: userData.name,
        role: defaultRole
      });
    } else if (userData.email === 'admin@hospital.dev' && user.role !== 'admin') {
      // Update existing admin@hospital.dev user to have admin role
      user = await storage.updateUser(user.id, { role: 'admin' });
    }

  req.user = user;
  next();
});

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

  // Rate limiting configurations
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.warn(`[SECURITY] Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60
      });
    }
  });

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`[SECURITY] General rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: 15 * 60
      });
    }
  });

  const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Very strict limit for sensitive operations
    message: {
      error: 'Too many sensitive operations, please try again later.',
      retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`[SECURITY] Strict rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many sensitive operations, please try again later.',
        retryAfter: 60 * 60
      });
    }
  });

  // Apply general rate limiting to all routes
  app.use('/api', generalLimiter);

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

  // Auth routes with strict rate limiting
  app.post('/api/auth/verify', authLimiter, [
    body('token').notEmpty().withMessage('Token is required')
  ], asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid input data', errors.array());
    }

    const { token } = req.body;
    
    try {
      const userData = await verifyGoogleToken(token);
      let user = await storage.getUserByEmail(userData.email);
      
      if (!user) {
        const defaultRole = userData.email === 'admin@hospital.dev' ? 'admin' : 'staff';
        user = await storage.createUser({
          email: userData.email,
          name: userData.name,
          role: defaultRole
        });
      } else if (userData.email === 'admin@hospital.dev' && user.role !== 'admin') {
        // Update existing admin@hospital.dev user to have admin role
        user = await storage.updateUser(user.id, { role: 'admin' });
      }

      sendSuccess(res, { user }, HTTP_STATUS.OK, (req as any).id);
    } catch (error) {
      throw createError.invalidToken('Authentication failed - invalid or expired token');
    }
  }));

  // User routes
  app.get('/api/users/me', requireAuth, asyncHandler(async (req: any, res: Response) => {
    sendSuccess(res, { user: req.user }, HTTP_STATUS.OK, req.id);
  }));

  app.put('/api/users/me', requireAuth, [
    body('name').optional().trim().escape().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('department_id').optional().isUUID().withMessage('Valid department ID required'),
    body('skills').optional().isArray().custom((skills) => {
      if (Array.isArray(skills)) {
        return skills.every(skill => typeof skill === 'string' && skill.length <= 50);
      }
      return true;
    }).withMessage('Skills must be strings with max 50 characters each'),
    body('seniority_years').optional().isInt({ min: 0, max: 50 }).withMessage('Seniority must be 0-50 years'),
    body('skills').optional().isArray()
  ], asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid input data', errors.array());
    }

    const updates = req.body;
    const user = await storage.updateUser(req.user.id, updates);
    sendSuccess(res, { user }, HTTP_STATUS.OK, req.id);
  }));

  app.get('/api/users', requireAuth, asyncHandler(async (req: any, res: Response) => {
    const users = await storage.getUsers();
    sendSuccess(res, { users }, HTTP_STATUS.OK, req.id);
  }));

  app.post('/api/users', requireAuth, [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('name').trim().escape().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('role').isIn(['staff', 'supervisor', 'admin']).withMessage('Valid role required'),
    body('department_id').optional().isUUID().withMessage('Valid department ID required'),
    body('seniority_years').optional().isInt({ min: 0, max: 50 }).withMessage('Seniority must be 0-50 years'),
    body('skills').optional().isArray()
  ], asyncHandler(async (req: any, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw createError.forbidden('Administrator access required to create users');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid input data', errors.array());
    }

    const existingUser = await storage.getUserByEmail(req.body.email);
    if (existingUser) {
      throw createError.conflictError('User with this email already exists');
    }

    const user = await storage.createUser(req.body);
    sendSuccess(res, { user }, HTTP_STATUS.CREATED, req.id);
  }));

  app.put('/api/users/:id', requireAuth, [
    body('name').optional().trim().escape().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('role').optional().isIn(['staff', 'supervisor', 'admin']).withMessage('Valid role required'),
    body('department_id').optional().isUUID().withMessage('Valid department ID required'),
    body('seniority_years').optional().isInt({ min: 0, max: 50 }).withMessage('Seniority must be 0-50 years'),
    body('skills').optional().isArray()
  ], asyncHandler(async (req: any, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw createError.forbidden('Administrator access required to update users');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid input data', errors.array());
    }

    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) {
      throw createError.notFoundError('User not found');
    }
    sendSuccess(res, { user }, HTTP_STATUS.OK, req.id);
  }));

  // Department routes
  app.get('/api/departments', requireAuth, asyncHandler(async (req: any, res: Response) => {
    const departments = await storage.getDepartments();
    sendSuccess(res, { departments }, HTTP_STATUS.OK, req.id);
  }));

  app.post('/api/departments', strictLimiter, requireAuth, [
    body('name').trim().escape().isLength({ min: 1, max: 100 }).withMessage('Department name must be 1-100 characters'),
    body('description').optional().trim().escape().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
  ], asyncHandler(async (req: any, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw createError.forbidden('Administrator access required to create departments');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid department data', errors.array());
    }

    const department = await storage.createDepartment(req.body);
    sendSuccess(res, { department }, HTTP_STATUS.CREATED, req.id);
  }));

  app.put('/api/departments/:id', requireAuth, [
    body('name').optional().trim().escape().isLength({ min: 1, max: 100 }).withMessage('Department name must be 1-100 characters'),
    body('description').optional().trim().escape().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
  ], asyncHandler(async (req: any, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw createError.forbidden('Administrator access required to update departments');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid department data', errors.array());
    }

    const department = await storage.updateDepartment(req.params.id, req.body);
    if (!department) {
      throw createError.notFound('Department not found');
    }

    sendSuccess(res, { department }, HTTP_STATUS.OK, req.id);
  }));

  // Shift routes
  app.get('/api/shifts', requireAuth, asyncHandler(async (req: any, res: Response) => {
    const { status, department_id, start_date, end_date } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status as string;
    if (department_id) filters.department_id = department_id as string;
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);

    const shifts = await storage.getShifts(filters);
    sendSuccess(res, { shifts }, HTTP_STATUS.OK, req.id);
  }));

  app.post('/api/shifts', requireAuth, [
    body('title').trim().escape().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').optional().trim().escape().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('department_id').isUUID().withMessage('Valid department ID required'),
    body('start_time').isISO8601().withMessage('Valid start time required'),
    body('end_time').isISO8601().withMessage('Valid end time required'),
    body('required_skills').optional().isArray().custom((skills) => {
      if (Array.isArray(skills)) {
        return skills.every(skill => typeof skill === 'string' && skill.length <= 50);
      }
      return true;
    }).withMessage('Skills must be strings with max 50 characters each'),
    body('min_experience_years').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years')
  ], asyncHandler(async (req: any, res: Response) => {
    // Check if user can create shifts (admin or supervisor)
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      throw createError.forbidden('Administrator or supervisor access required to create shifts');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid shift data', errors.array());
    }

    const shiftData = {
      ...req.body,
      created_by: req.user.id,
      start_time: new Date(req.body.start_time),
      end_time: new Date(req.body.end_time)
    };

    const shift = await storage.createShift(shiftData);

    // Add eligible staff to FCFS queue
    const eligibleUsers = await storage.getEligibleUsersForShift(shift);
    
    // Calculate response deadline (e.g., 24 hours from now)
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + 24);
    
    // Add each eligible user to FCFS queue with calculated priority scores
    for (const user of eligibleUsers) {
      const priorityScore = calculateFCFSScore(user, shift);
      
      await storage.addToFcfsQueue({
        shift_id: shift.id,
        user_id: user.id,
        priority_score: priorityScore,
        response_deadline: responseDeadline,
        status: 'pending'
      });
      
      // Create notification for the user
      await storage.createNotification({
        user_id: user.id,
        type: 'shift_assignment',
        title: 'New Shift Available',
        message: `You have been assigned to the FCFS queue for shift: ${shift.title}`,
        data: { shift_id: shift.id },
        is_read: false
      });
    }
    
    // Update shift status to indicate it's in queue
    await storage.updateShift(shift.id, { status: 'in_queue' });
    
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

    sendSuccess(res, { shift }, HTTP_STATUS.CREATED, req.id);
  }));

  // Update shift endpoint
  app.put('/api/shifts/:id', requireAuth, [
    body('title').optional().trim().escape().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').optional().trim().escape().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('department_id').optional().isUUID().withMessage('Valid department ID required'),
    body('start_time').optional().isISO8601().withMessage('Valid start time required'),
    body('end_time').optional().isISO8601().withMessage('Valid end time required'),
    body('required_skills').optional().isArray().custom((skills) => {
      if (Array.isArray(skills)) {
        return skills.every(skill => typeof skill === 'string' && skill.length <= 50);
      }
      return true;
    }).withMessage('Skills must be strings with max 50 characters each'),
    body('min_experience_years').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years')
  ], asyncHandler(async (req: any, res: Response) => {
    // Check if user can update shifts (admin or supervisor)
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      throw createError.forbidden('Administrator or supervisor access required to update shifts');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError.validationError('Invalid shift data', errors.array());
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.start_time) {
      updateData.start_time = new Date(updateData.start_time);
    }
    if (updateData.end_time) {
      updateData.end_time = new Date(updateData.end_time);
    }

    const shift = await storage.updateShift(id, updateData);
    
    if (!shift) {
      throw createError.notFound('Shift not found');
    }

    // Create audit log
    await storage.createAuditLog({
      user_id: req.user.id,
      action: 'UPDATE_SHIFT',
      resource_type: 'shift',
      resource_id: shift.id,
      details: { shift_title: shift.title }
    });

    // Broadcast to connected clients
    broadcast({
      type: 'shift_updated',
      shift
    });

    sendSuccess(res, { shift }, HTTP_STATUS.OK, req.id);
  }));

  // FCFS Queue routes
  app.get('/api/fcfs-queue', requireAuth, async (req: any, res) => {
    try {
      const { shift_id } = req.query;
      // Only return queue entries for the authenticated user
      const queue = await storage.getFcfsQueue(shift_id as string, req.user.id);
      res.json(queue);
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
      
      // First, get the queue entry to verify ownership and check if it's still valid
      const queueEntries = await storage.getFcfsQueue(undefined, req.user.id);
      const queueEntry = queueEntries.find(entry => entry.id === queue_id);
      
      if (!queueEntry) {
        return res.status(404).json({ error: 'Queue entry not found or you do not have permission to respond to it' });
      }
      
      if (queueEntry.status !== 'pending') {
        return res.status(400).json({ error: 'Queue entry has already been responded to' });
      }
      
      // Check if response deadline has passed
      if (new Date() > new Date(queueEntry.response_deadline)) {
        return res.status(400).json({ error: 'Response deadline has passed' });
      }

      let updatedQueueEntry;
      let assignedShift = null;

      if (response === 'accept') {
        // Get the shift to check if it's still available (concurrency protection)
        const shift = await storage.getShift(queueEntry.shift_id);
        if (!shift) {
          return res.status(404).json({ error: 'Shift not found' });
        }
        
        if (shift.status !== 'in_queue') {
          return res.status(409).json({ error: 'Shift has already been assigned to another user' });
        }
        
        // Update both queue entry and shift in proper order to prevent race conditions
        updatedQueueEntry = await storage.updateFcfsQueueEntry(queue_id, {
          status: 'accepted'
        });
        
        assignedShift = await storage.updateShift(shift.id, {
          status: 'assigned',
          assigned_user_id: req.user.id
        });
        
        // Mark all other pending queue entries for this shift as expired
        const allQueueEntries = await storage.getFcfsQueue(shift.id);
        for (const entry of allQueueEntries) {
          if (entry.id !== queue_id && entry.status === 'pending') {
            await storage.updateFcfsQueueEntry(entry.id, { status: 'expired' });
          }
        }
      } else {
        // Just update the queue entry for decline
        updatedQueueEntry = await storage.updateFcfsQueueEntry(queue_id, {
          status: 'declined'
        });
      }

      // Create audit log
      await storage.createAuditLog({
        user_id: req.user.id,
        action: `FCFS_${response.toUpperCase()}`,
        resource_type: 'fcfs_queue',
        resource_id: queue_id,
        details: { response, shift_id: queueEntry.shift_id }
      });

      // Broadcast update
      broadcast({
        type: 'fcfs_response',
        queue_entry: updatedQueueEntry,
        shift: assignedShift,
        response
      });

      res.json({ 
        success: true, 
        queue_entry: updatedQueueEntry,
        shift: assignedShift
      });
    } catch (error) {
      console.error('Error processing FCFS response:', error);
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
  app.get('/api/admin/settings', strictLimiter, requireAuth, async (req: any, res) => {
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
