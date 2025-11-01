// server/tests/unit/authMiddleware.test.js
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { authenticateToken } = require('../../src/middleware/auth');

jest.mock('../../src/models/User');

describe('Auth Middleware Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should return 401 if no token is provided', async () => {
    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET || 'fallback_secret');
    mockReq.headers = { authorization: `Bearer ${token}` };
    
    User.findById.mockResolvedValue(null);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', async () => {
    const invalidToken = 'invalid_token';
    mockReq.headers = { authorization: `Bearer ${invalidToken}` };

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should attach user to request and call next if token is valid', async () => {
    const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET || 'fallback_secret');
    const mockUser = { _id: 'user123', username: 'testuser', email: 'test@example.com' };
    
    mockReq.headers = { authorization: `Bearer ${token}` };
    User.findById.mockResolvedValue(mockUser);

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should handle server errors', async () => {
    const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET || 'fallback_secret');
    mockReq.headers = { authorization: `Bearer ${token}` };
    
    User.findById.mockRejectedValue(new Error('Database error'));

    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
  });
});