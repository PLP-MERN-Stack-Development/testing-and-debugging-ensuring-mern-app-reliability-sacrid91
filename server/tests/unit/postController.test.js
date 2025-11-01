// server/tests/unit/postController.test.js
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const postController = require('../../src/controllers/postController');

jest.mock('../../src/models/Post');
jest.mock('../../src/models/User');

describe('Post Controller Unit Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('getPosts', () => {
    it('should return posts with default pagination', async () => {
      const mockPosts = [{ title: 'Test Post' }];
      Post.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockPosts),
      });

      await postController.getPosts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should return posts with category filter', async () => {
      mockReq.query = { category: 'tech' };
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([]),
      };
      
      Post.find.mockReturnValue(mockQuery);

      await postController.getPosts(mockReq, mockRes);

      expect(Post.find).toHaveBeenCalledWith({ category: 'tech' });
    });

    it('should handle errors', async () => {
      Post.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await postController.getPosts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      const mockPost = { title: 'Test Post', _id: '123' };
      Post.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPost),
      });

      mockReq.params = { id: '123' };

      await postController.getPostById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return 404 if post not found', async () => {
      Post.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      mockReq.params = { id: '123' };

      await postController.getPostById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Post not found' });
    });

    it('should handle errors', async () => {
      Post.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      mockReq.params = { id: '123' };

      await postController.getPostById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const mockPostData = { title: 'New Post', content: 'Content', category: 'tech' };
      const mockSavedPost = { ...mockPostData, _id: '123', author: 'user123', slug: 'new-post' };
      
      mockReq.body = mockPostData;
      mockReq.user = { _id: 'user123' };
      
      Post.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(mockSavedPost),
      }));

      await postController.createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockSavedPost);
    });

    it('should handle validation errors', async () => {
      const mockPostData = { content: 'Content' }; // Missing required title
      
      mockReq.body = mockPostData;
      mockReq.user = { _id: 'user123' };
      
      Post.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error('Title is required')),
      }));

      await postController.createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Title is required' });
    });
  });

  describe('updatePost', () => {
    it('should update a post when user is the author', async () => {
      const mockPost = { title: 'Old Title', author: 'user123', _id: '123' };
      const mockUpdatedPost = { title: 'New Title', author: 'user123', _id: '123' };
      
      Post.findById.mockResolvedValue(mockPost);
      Post.findByIdAndUpdate.mockResolvedValue(mockUpdatedPost);

      mockReq.params = { id: '123' };
      mockReq.body = { title: 'New Title' };
      mockReq.user = { _id: 'user123' };

      await postController.updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedPost);
    });

    it('should return 403 if user is not the author', async () => {
      const mockPost = { title: 'Old Title', author: 'user456', _id: '123' };
      
      Post.findById.mockResolvedValue(mockPost);

      mockReq.params = { id: '123' };
      mockReq.body = { title: 'New Title' };
      mockReq.user = { _id: 'user123' }; // Different user

      await postController.updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authorized to update this post' });
    });

    it('should return 404 if post not found', async () => {
      Post.findById.mockResolvedValue(null);

      mockReq.params = { id: '123' };
      mockReq.body = { title: 'New Title' };
      mockReq.user = { _id: 'user123' };

      await postController.updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Post not found' });
    });
  });

  describe('deletePost', () => {
    it('should delete a post when user is the author', async () => {
      const mockPost = { title: 'To Delete', author: 'user123', _id: '123' };
      
      Post.findById.mockResolvedValue(mockPost);
      Post.findByIdAndDelete.mockResolvedValue(mockPost);

      mockReq.params = { id: '123' };
      mockReq.user = { _id: 'user123' };

      await postController.deletePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Post deleted successfully' });
    });

    it('should return 403 if user is not the author', async () => {
      const mockPost = { title: 'To Delete', author: 'user456', _id: '123' };
      
      Post.findById.mockResolvedValue(mockPost);

      mockReq.params = { id: '123' };
      mockReq.user = { _id: 'user123' }; // Different user

      await postController.deletePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authorized to delete this post' });
    });
  });
});