import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for Google token verification
global.fetch = vi.fn();

// Mock storage
const mockStorage = {
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
};

vi.mock('../storage', () => ({
  storage: mockStorage,
}));

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Google Token Verification', () => {
    it('should handle development token bypass', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Import after setting environment
      const { verifyGoogleToken } = await import('../routes');

      const result = await verifyGoogleToken('dev-token');
      
      expect(result).toEqual({
        email: 'admin@hospital.dev',
        name: 'Development Admin',
        sub: 'dev-user-123'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should verify valid Google token in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockTokenData = {
        email: 'user@example.com',
        name: 'Test User',
        sub: 'google-user-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenData)
      });

      const { verifyGoogleToken } = await import('../routes');
      const result = await verifyGoogleToken('valid-google-token');

      expect(result).toEqual(mockTokenData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/tokeninfo?id_token=valid-google-token',
        expect.objectContaining({
          headers: {
            'User-Agent': 'Hospital-Scheduler/1.0'
          }
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle invalid token response', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { verifyGoogleToken } = await import('../routes');

      await expect(verifyGoogleToken('invalid-token')).rejects.toThrow('Token verification failed');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle malformed token payload', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'payload' })
      });

      const { verifyGoogleToken } = await import('../routes');

      await expect(verifyGoogleToken('malformed-token')).rejects.toThrow('Token verification failed');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle network timeout', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      (global.fetch as any).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          // Simulate AbortController timeout
          setTimeout(() => reject(new Error('AbortError')), 10);
        });
      });

      const { verifyGoogleToken } = await import('../routes');

      await expect(verifyGoogleToken('timeout-token')).rejects.toThrow('Token verification failed');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('FCFS Algorithm', () => {
    it('should calculate priority score correctly', async () => {
      const { calculateFCFSScore } = await import('../routes');

      const user = {
        seniority_years: 5,
        last_shift_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        skills: ['ICU', 'Emergency']
      };

      const shift = {
        required_skills: ['ICU', 'Pediatric']
      };

      const score = calculateFCFSScore(user, shift);

      // Seniority: 5 * 3 = 15
      // Last shift: 7 days * 0.2 = 1.4
      // Skills match: 1/2 * 25 = 12.5
      // Availability: 25
      // Total: 15 + 1.4 + 12.5 + 25 = 53.9

      expect(score).toBe(53.9);
    });

    it('should handle user with no previous shifts', async () => {
      const { calculateFCFSScore } = await import('../routes');

      const user = {
        seniority_years: 2,
        last_shift_date: null,
        skills: ['General']
      };

      const shift = {
        required_skills: ['General']
      };

      const score = calculateFCFSScore(user, shift);

      // Seniority: 2 * 3 = 6
      // No last shift: 20
      // Skills match: 1/1 * 25 = 25
      // Availability: 25
      // Total: 6 + 20 + 25 + 25 = 76

      expect(score).toBe(76);
    });

    it('should handle missing skills gracefully', async () => {
      const { calculateFCFSScore } = await import('../routes');

      const user = {
        seniority_years: 3,
        skills: null
      };

      const shift = {
        required_skills: ['ICU']
      };

      const score = calculateFCFSScore(user, shift);

      // Should not throw error and return reasonable score
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });
});