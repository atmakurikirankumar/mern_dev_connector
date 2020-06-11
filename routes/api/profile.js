const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const verifyToken = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
const axios = require("axios");
const config = require("config");

// @route GET api/profile/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate("user", [
      "name",
      "avatar",
    ]);
    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// @route POST Create/Update Profile
router.post(
  "/",
  [
    verifyToken,
    [
      check("status", "Status is required").notEmpty(),
      check("skills", "Skills is required").notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    const profileFields = {
      user: req.user.id,
      company,
      location,
      website: website && website !== "" ? normalize(website, { forceHttps: true }) : "",
      bio,
      skills: Array.isArray(skills) ? skills : skills.split(",").map((skill) => " " + skill.trim()),
      status,
      githubusername,
    };

    const socialfields = { youtube, twitter, instagram, linkedin, facebook };

    for (const [key, value] of Object.entries(socialfields)) {
      if (value && value.length > 0) socialfields[key] = normalize(value, { forceHttps: true });
    }
    profileFields.social = socialfields;

    try {
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      return res.status(201).json(profile);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server Error");
    }
  }
);

// GET All profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate({ path: "user", select: ["name", "avatar"] });
    return res.status(200).json(profiles);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// DELETE profile
router.delete("/", verifyToken, async (req, res) => {
  try {
    // Delete profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Delete user
    await User.findByIdAndRemove(req.user.id);

    return res.status(200).json({ msg: "User Deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// GET Profile by User id
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate({
      path: "user",
      select: ["name", "avatar"],
    });
    if (!profile) {
      return res
        .status(404)
        .json({ msg: `Profile does not exist for the user id - ${req.params.user_id}` });
    }
    return res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res
        .status(404)
        .json({ msg: `Profile does not exist for the user id - ${req.params.user_id}` });
    }
    return res.status(500).send("Server Error");
  }
});

// Update profile document to add experience
router.put(
  "/experience",
  [
    verifyToken,
    [
      check("title", "Title is required").notEmpty(),
      check("company", "Company is required").notEmpty(),
      check("from", "From Date is required").notEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { title, company, location, from, to, current, description } = req.body;
      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      };

      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      return res.status(200).json(profile);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server Error");
    }
  }
);

// Delete experience from profile
router.delete("/experience/:exp_id", verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience = profile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// Update profile document to add experience
router.put(
  "/education",
  [
    verifyToken,
    [
      check("school", "School is required").notEmpty(),
      check("degree", "Degree is required").notEmpty(),
      check("fieldofstudy", "FieldOfStudy is required").notEmpty(),
      check("from", "From date is required and needs to be in the past")
        .notEmpty()
        .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    ],
  ],
  async (req, res) => {
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      return res.status(200).json(profile);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server Error");
    }
  }
);

// Delete education from profile
router.delete("/education/:edu_id", verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education = profile.education.filter((edu) => edu._id.toString() !== req.params.edu_id);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// GET User repos
router.get("/github/:username", async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      "user-agent": "node.js",
      Authorization: `token ${config.get("gh_token")}`,
    };

    const gitHubResponse = await axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
