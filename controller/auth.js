const user = require("../schema/user");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const endecryption = require("../helper/common");
const helper = require("../helper/common");
const db = require("../model/db");
const keyfile = require("../config/keyfile");

exports.register = async (req, res) => {
  try {
    let info = req.body;

    if (!info.registerType) {
      return res
        .status(400)
        .json({ status: false, msg: "Register type is required" });
    }

    let object;
    const emailToCheck =
      info.registerType === "employee" ? info.businessEmail : info.email;

    const existingUser = await db.user.findOne(
      {
        $or: [
          { email: emailToCheck.toLowerCase() },
          { businessEmail: emailToCheck.toLowerCase() },
        ],
      },
      {
        email: 1,
        businessEmail: 1,
      }
    );
    if (existingUser) {
      return res
        .status(400)
        .json({ status: false, msg: "This email is already used" });
    }

    if (info.registerType === "employee") {
      if (
        !info.companyName ||
        !info.businessNumber ||
        !info.businessEmail ||
        !info.address ||
        !info.password
      ) {
        return res.status(400).json({
          status: false,
          msg: "Missing fields for employee registration",
        });
      }

      object = {
        companyName: info.companyName,
        businessNumber: info.businessNumber,
        businessEmail: info.businessEmail.toLowerCase(),
        address: info.address,
        password: endecryption.encrypt(info.password),
        registerType: info.registerType,
      };

      const data = await db.user.create(object);
      const token = jwt.sign({ id: data._id }, keyfile.JWT_SECRET, {
        expiresIn: "1y",
      });

      res.status(200).json({
        status: true,
        msg: "Company registered successfully",
        accessToken: token,
        user: {
          id: data._id,
          companyName: data.companyName,
          businessEmail: data.businessEmail,
          businessNumber: data.businessNumber,
          address: data.address,
          registerType: data.registerType,
        },
      });
    } else if (info.registerType === "jobs") {
      if (!info.email || !info.password || !info.userName || !info.phone) {
        return res
          .status(400)
          .json({ status: false, msg: "Missing fields for job registration" });
      }

      object = {
        email: info.email.toLowerCase(),
        password: endecryption.encrypt(info.password),
        userName: info.userName,
        phone: info.phone,
        registerType: info.registerType,
      };

      const data = await db.user.create(object);
      const token = jwt.sign({ id: data._id }, keyfile.JWT_SECRET, {
        expiresIn: "1y",
      });

      res.status(200).json({
        status: true,
        msg: "Job seeker registered successfully",
        accessToken: token,
        user: {
          id: data._id,
          userName: data.userName,
          email: data.email,
          phone: data.phone,
          registerType: data.registerType,
        },
      });
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Invalid register type" });
    }
  } catch (err) {
    res.status(400).json({ status: false, msg: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    let info = req.body;

    if (!info.email || !info.password) {
      return res
        .status(400)
        .json({ status: false, msg: "Email and password are required" });
    }

    const user = await db.user.findOne(
      {
        $or: [
          { email: info.email.toLowerCase() },
          { businessEmail: info.email.toLowerCase() },
        ],
      },
      {
        email: 1,
        businessEmail: 1,
        _id: 1,
        userName: 1,
        password: 1,
        phone: 1,
        businessNumber: 1,
        companyName: 1,
        address: 1,
      }
    );

    if (!user) {
      return res.status(404).json({ status: false, msg: "Email is incorrect" });
    }

    const isPasswordCorrect =
      user.password === endecryption.encrypt(info.password);
    if (!isPasswordCorrect) {
      return res
        .status(404)
        .json({ status: false, msg: "Password is incorrect" });
    }
    let userToken = helper.createPayload(
      { _id: user._id, email: user.email },
      keyfile.JWT_SECRET,
      {
        expiresIn: "1y",
      }
    );

    const token = jwt.sign({ id: user._id }, keyfile.JWT_SECRET, {
      expiresIn: "1y",
    });
    console.log("token", userToken);

    res.status(200).json({
      status: true,
      msg: "Login Success",
      accessToken: userToken,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email || user.businessEmail,
        phone: user.phone || user.businessNumber,
        address: user.address,
        companyName: user.companyName,
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ status: false, msg: "Login failed", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        msg: "Email, new password, and confirm password are required",
      });
    }

    const user = await db.user.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        msg: "New password and confirm password do not match",
      });
    }

    user.password = endecryption.encrypt(newPassword);
    await user.save();

    res
      .status(200)
      .json({ status: true, msg: "Password reset successfully", user });
  } catch (error) {
    res.status(400).json({ status: false, msg: error.message });
  }
};

exports.imageUpload = async (req, res) => {
  try {
    res.status(200).json({ status: true, msg: "File uploaded successfully" });
  } catch (err) {
    res.status(400).json({ status: false, msg: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId, userName, password, email, phone } = req.body;
    if (!userId || !userName || !password || !email || !phone) {
      return res
        .status(400)
        .json({ status: false, msg: "All fields are required" });
    }

    const updateUser = await db.user.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          userName: userName,
          password: endecryption.encrypt(password),
          email: email.toLowerCase(),
          phone: phone,
        },
      },
      { new: true }
    );
    if (updateUser) {
      res.status(200).json({
        status: true,
        msg: "User updated successfully",
        result: updateUser,
      });
    } else {
      res.status(404).json({ status: false, msg: "User not found" });
    }
  } catch (err) {
    res.status(400).json({ status: false, msg: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ status: false, msg: "User ID is required" });
    }

    const deleteUser = await db.user.findOneAndDelete({ _id: userId });

    if (deleteUser) {
      res.status(200).json({
        status: true,
        msg: "User deleted successfully",
        result: deleteUser,
      });
    } else {
      res.status(404).json({ status: false, msg: "User not found" });
    }
  } catch (err) {
    res.status(400).json({ status: false, msg: err.message });
  }
};

exports.GetOneUser = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("TCL: exports.GetOneUser -> userId", userId);
    const data = await db.user.find(userId);
    console.log("TCL: exports.getUsers -> data", data);
    if (data.length > 0) {
      res.status(200).json({
        status: true,
        msg: "Users retrieved successfully",
        result: data,
      });
    } else {
      res.status(404).json({ status: false, msg: "No users found" });
    }
  } catch (err) {
    res.status(400).json({ status: false, msg: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"]; // Ensure the header key is correct
    if (!authHeader) {
      console.log("No auth header found");
      return res.sendStatus(204); // No content
    }

    // Extract the token from the authorization header (assuming Bearer scheme)
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log("No token found in the authorization header");
      return res.sendStatus(204); // No content
    }

    const checkIfBlacklisted = await db.blacklist.findOne({ token: token }); // Check if the token is blacklisted
    if (checkIfBlacklisted) {
      console.log("Token is already blacklisted");
      return res.sendStatus(204); // No content
    }

    const newBlacklist = new db.blacklist({ token: token }); // Add the token to the blacklist
    await newBlacklist.save();

    // Clear the cookie on the client side
    res.setHeader('Set-Cookie', 'accessToken=; HttpOnly; Path=/; Max-Age=0');
    res.status(200).json({ message: "You are logged out!" });
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};



