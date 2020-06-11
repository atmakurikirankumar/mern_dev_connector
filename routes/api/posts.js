const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route POST api/posts
router.post(
  "/",
  [verifyToken, [check("text", "Text is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erros: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      return res.status(201).json(post);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server Error");
    }
  }
);

// GET all posts
router.get("/", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.status(200).json(posts);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// GET post by id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.status(500).send("Server Error");
  }
});

// Delete post by id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    // check post owner
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "You are not authorized" });
    }
    await post.remove();
    return res.json({ msg: "Post removed" });
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.status(500).send("Server Error");
  }
});

//Like the post
router.put("/like/:post_id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "You cant like the post more than once" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.status(500).send("Server Error");
  }
});

//Unlike the post
router.put("/unlike/:post_id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not been liked yet" });
    }

    post.likes = post.likes.filter((like) => like.user.toString() !== req.user.id);
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.status(500).send("Server Error");
  }
});

// add a comment on the post
router.post("/comment/:post_id", [
  verifyToken,
  [check("text", "Text is required").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(404).json({ msg: "Post Not found" });
      }
      const user = await User.findById(req.user.id);

      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };
      post.comments.unshift(newComment);
      await post.save();
      return res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      if (error.kind === "ObjecId") {
        return res.status(404).json({ msg: "Post Not found" });
      }
      return res.status(500).send("Server Error");
    }
  },
]);

// Delete a comment
router.delete("/comment/:post_id/:comment_id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const comment = post.comments.find((comment) => comment.id === req.params.comment_id);
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    if (comment.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: "You are not authorized" });
    }
    post.comments = post.comments.filter((comment) => comment.id !== req.params.comment_id);
    await post.save();
    return res.status(200).json(post.comments);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
