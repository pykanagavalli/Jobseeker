const user = require("../schema/user");
const business = require('../schema/business')
const jwt = require("jsonwebtoken");
const multer = require("multer");
const endecryption = require("../helper/common");
const helper = require("../helper/common");
const db = require("../model/db");
const keyfile = require("../config/keyfile");
const mongoose = require('mongoose')

exports.register = async (req, res) => {
  try {
    let info = req.body;

    if (!info.registerType) {
      return res
        .status(400)
        .json({ status: false, msg: "Register type is required" });
    }

    let emailToCheck;
    if (info.registerType === "business") {
      emailToCheck = info.businessEmail;
    } else if (info.registerType === "jobs") {
      emailToCheck = info.email;
    }

    if (!emailToCheck) {
      return res
        .status(400)
        .json({ status: false, msg: "Email is required" });
    }

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

    let object;
    if (info.registerType === "business") {
      const { companyName, businessNumber, businessEmail, address, password } = info;

      if (!companyName || !businessNumber || !businessEmail || !password) {
        return res.status(400).json({
          status: false,
          msg: "Missing fields for business registration",
        });
      }

      object = {
        companyName,
        businessNumber,
        businessEmail: businessEmail.toLowerCase(),
        address,
        password: endecryption.encrypt(password),
        registerType: info.registerType,
      };

      const data = await db.business.create(object);
      let userToken = helper.createPayload(
        { _id: data._id, email: data.email },
        keyfile.JWT_SECRET, { expiresIn: "1y" });
      console.log("token", userToken);
      res.status(200).json({
        status: true,
        msg: "Business registered successfully",
        accessToken: userToken,
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
      const { email, password, userName, phone } = info;

      if (!email || !password || !userName || !phone) {
        return res
          .status(400)
          .json({ status: false, msg: "Missing fields for job registration" });
      }

      object = {
        email: email.toLowerCase(),
        password: endecryption.encrypt(password),
        userName,
        phone,
        registerType: info.registerType,
      };

      const data = await db.user.create(object);
      let userToken = helper.createPayload(
        { _id: data._id, email: data.email },
        keyfile.JWT_SECRET, { expiresIn: "1y" });
      console.log("token", userToken);

      res.status(200).json({
        status: true,
        msg: "Job seeker registered successfully",
        accessToken: userToken,
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
    const info = req.body;
    let user;
    if (info.loginType === 'jobs') {
      user = await db.user.findOne(
        { email: info.email.toLowerCase() },
        {
          email: 1,
          _id: 1,
          userName: 1,
          password: 1,
          phone: 1,
          address: 1,
        }
      );
    } else if (info.loginType === 'business') {
      user = await db.business.findOne(
        { businessEmail: info.businessEmail},
        {
          businessEmail: 1,
          _id: 1,
          companyName: 1,
          password: 1,
          businessNumber: 1,
          address: 1,
        }
      );
    } else {
      return res.status(400).json({ status: false, msg: "Invalid registerType" });
    }

    if (!user) {
      return res.status(404).json({ status: false, msg: "Email is incorrect" });
    }

    const isPasswordCorrect = user.password === endecryption.encrypt(info.password);
    if (!isPasswordCorrect) {
      return res.status(404).json({ status: false, msg: "Password is incorrect" });
    }

    const userType = info.loginType;
    const email = userType === 'business' ? user.businessEmail : user.email;
    const userName = userType === 'business' ? user.companyName : user.userName;
    const phone = userType === 'business' ? user.businessNumber : user.phone;
    const address = user.address;

    let userToken = helper.createPayload(
      { _id: user._id, email },
      keyfile.JWT_SECRET,
      {
        expiresIn: "1y",
      }
    );

    res.status(200).json({
      status: true,
      msg: "Login Success",
      accessToken: userToken,
      user: {
        id: user._id,
        userName,
        email,
        phone,
        address,
        userType,
      },
    });
  } catch (error) {
    res.status(400).json({ status: false, msg: "Login failed", error: error.message });
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

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("userid", userId)
    const data = await db.user.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    console.log('data : ', data.registerType)
    var object;
    if ((data.registerType == "jobs")) {
      object = {
        id: data._id,
        email: data.email,
        userName: data.userName,
        phone: data.phone,
        registerType: data.registerType,
      };
    }
    else if ((data.registerType == "employee")) {
      object = {
        id: data._id,
        companyName: data.companyName,
        businessEmail: data.businessEmail,
        businessNumber: data.businessNumber,
        address: data.address,
        registerType: data.registerType,
      };
    }
    if (data != null) {

      res.status(200).json({
        status: true,
        msg: "Users details retrieved successfully",
        data: object,
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



