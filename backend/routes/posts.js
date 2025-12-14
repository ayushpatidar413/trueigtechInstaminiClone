import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, [
    body('imageUrl')
        .notEmpty()
        .withMessage('Image URL is required')
        .isURL()
        .withMessage('Please provide a valid URL'),
    body('caption')
        .optional()
        .isLength({ max: 2200 })
        .withMessage('Caption cannot exceed 2200 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { imageUrl, caption } = req.body;

        const post = await Post.create({
            user: req.user.id,
            imageUrl,
            caption: caption || ''
        });

        await post.populate('user', 'username profilePicture');

        res.status(201).json({
            success: true,
            post
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/posts/:id
// @desc    Get a single post
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', 'username profilePicture');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Get comments for this post
        const comments = await Comment.find({ post: post._id })
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 });

        // Check if current user has liked this post
        const isLiked = post.likes.includes(req.user.id);

        res.status(200).json({
            success: true,
            post: {
                ...post.toObject(),
                isLiked,
                comments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user owns the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this post'
            });
        }

        // Delete all comments for this post
        await Comment.deleteMany({ post: post._id });

        // Delete the post
        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if already liked
        if (post.likes.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'You have already liked this post'
            });
        }

        // Add like
        post.likes.push(req.user.id);
        await post.save();

        res.status(200).json({
            success: true,
            message: 'Post liked successfully',
            likeCount: post.likes.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/posts/:id/like
// @desc    Unlike a post
// @access  Private
router.delete('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if not liked
        if (!post.likes.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'You have not liked this post'
            });
        }

        // Remove like
        post.likes = post.likes.filter(id => id.toString() !== req.user.id);
        await post.save();

        res.status(200).json({
            success: true,
            message: 'Post unliked successfully',
            likeCount: post.likes.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', protect, [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Comment text is required')
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = await Comment.create({
            post: req.params.id,
            user: req.user.id,
            text: req.body.text
        });

        await comment.populate('user', 'username profilePicture');

        res.status(201).json({
            success: true,
            comment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/posts/:id/comments
// @desc    Get all comments for a post
// @access  Private
router.get('/:id/comments', protect, async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.id })
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            comments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
