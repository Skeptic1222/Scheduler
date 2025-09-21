import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { globalErrorHandler, requestIdMiddleware } from "./utils/errors";

const app = express();

// Add request ID middleware for request tracking
app.use(requestIdMiddleware);

// Security headers with helmet - Environment-specific CSP
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"], // unsafe-inline needed for styled components
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: isDevelopment 
        ? ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"] // Dev needs unsafe-inline for Vite
        : ["'self'", "https://accounts.google.com", "https://apis.google.com"], // Production removes unsafe-inline
      connectSrc: isDevelopment
        ? ["'self'", "wss:", "ws:", "https://oauth2.googleapis.com"] // Dev allows WS for HMR
        : ["'self'", "wss:", "https://oauth2.googleapis.com"], // Production only secure WS
      imgSrc: ["'self'", "data:", "https:"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      formAction: ["'self'"],
      baseUri: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: isDevelopment ? false : { policy: "require-corp" }, // Only restrict in production
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Input sanitization
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    log(`[SECURITY] Sanitized potentially malicious input: ${key} in ${req.method} ${req.path}`);
  }
}));

// Trust proxy for accurate client IP
app.set('trust proxy', 1);

app.use(express.json({ limit: "10mb" })); // Reduced limit for security
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Redact sensitive information for HIPAA compliance
        const redactSensitiveData = (obj: any): any => {
          if (typeof obj !== 'object' || obj === null) return obj;
          
          const redacted = { ...obj };
          const sensitiveFields = ['email', 'name', 'personal_info', 'ssn', 'phone', 'address'];
          
          // Redact sensitive fields
          for (const field of sensitiveFields) {
            if (redacted[field]) {
              redacted[field] = '[REDACTED]';
            }
          }
          
          // Recursively redact nested objects
          for (const key in redacted) {
            if (typeof redacted[key] === 'object' && redacted[key] !== null) {
              redacted[key] = redactSensitiveData(redacted[key]);
            }
          }
          
          return redacted;
        };
        
        const safeResponse = redactSensitiveData(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }

      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use comprehensive error handling middleware
  app.use(globalErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
