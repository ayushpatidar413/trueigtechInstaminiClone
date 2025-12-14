import express from 'express';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/feed
// @desc    Get feed of posts from followed users
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get list of users that the current user follows
        const following = await Follow.find({ follower: req.user.id }).select('following');
        const followingIds = following.map(f => f.following);

        // Include user's own posts in feed
        followingIds.push(req.user.id);

        // Get posts from followed users
        const posts = await Post.find({ user: { $in: followingIds } })
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Post.countDocuments({ user: { $in: followingIds } });

        // Add isLiked and comment count to each post
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            const isLiked = post.likes.includes(req.user.id);
            
            return {
                ...post.toObject(),
                isLiked,
                commentCount
            };
        }));

        res.status(200).json({
            success: true,
            posts: postsWithDetails,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
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

export default router;
