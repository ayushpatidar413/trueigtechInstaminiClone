import express from 'express';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', protect, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' }
        }).select('username profilePicture bio').limit(20);

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get follower and following counts
        const followerCount = await Follow.countDocuments({ following: user._id });
        const followingCount = await Follow.countDocuments({ follower: user._id });

        // Check if current user follows this user
        const isFollowing = await Follow.findOne({
            follower: req.user.id,
            following: user._id
        });

        // Get post count
        const postCount = await Post.countDocuments({ user: user._id });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                followerCount,
                followingCount,
                postCount,
                isFollowing: !!isFollowing
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

// @route   GET /api/users/:id/posts
// @desc    Get all posts by a user
// @access  Private
router.get('/:id/posts', protect, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.id })
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            posts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Private
router.get('/:id/followers', protect, async (req, res) => {
    try {
        const followers = await Follow.find({ following: req.params.id })
            .populate('follower', 'username profilePicture bio');

        res.status(200).json({
            success: true,
            followers: followers.map(f => f.follower)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/:id/following
// @desc    Get users that this user follows
// @access  Private
router.get('/:id/following', protect, async (req, res) => {
    try {
        const following = await Follow.find({ follower: req.params.id })
            .populate('following', 'username profilePicture bio');

        res.status(200).json({
            success: true,
            following: following.map(f => f.following)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
    try {
        // Cannot follow yourself
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        // Check if user exists
        const userToFollow = await User.findById(req.params.id);
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: req.user.id,
            following: req.params.id
        });

        if (existingFollow) {
            return res.status(400).json({
                success: false,
                message: 'You are already following this user'
            });
        }

        // Create follow relationship
        await Follow.create({
            follower: req.user.id,
            following: req.params.id
        });

        res.status(200).json({
            success: true,
            message: 'Successfully followed user'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/users/:id/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/follow', protect, async (req, res) => {
    try {
        // Cannot unfollow yourself
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot unfollow yourself'
            });
        }

        // Find and delete the follow relationship
        const follow = await Follow.findOneAndDelete({
            follower: req.user.id,
            following: req.params.id
        });

        if (!follow) {
            return res.status(400).json({
                success: false,
                message: 'You are not following this user'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Successfully unfollowed user'
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
