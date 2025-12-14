import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Please provide a comment'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
