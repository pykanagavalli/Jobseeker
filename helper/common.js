var jwt = require("jsonwebtoken");
const keyfile = require("../config/keyfile");
const db = require("../model/db");
const fs = require("fs");
const crypto = require("crypto");
// const jwt_decode = require("jwt-decode");
var jwtTokenUser = keyfile.JWT_SECREAT;
const algorithm =keyfile.ALGORITHM;
const password = keyfile.PASSWORD
const iv = keyfile.IV


exports.get_details = (req, res, next) => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName of Object.keys(interfaces)) {
        const addresses = interfaces[interfaceName];
        for (const address of addresses) {
            if (address.family === "IPv4" && !address.internal) {
                next();
            }
        }
    }
};

exports.createPayload = (key) => {
    const payload = { subject: key };
    const expiresInSeconds = 24 * 60 * 60; // (1 day)
    let token = jwt.sign(payload, jwtTokenUser, { expiresIn: expiresInSeconds });
    return token;
};

exports.verifyPayload = (req, res, next) => {
    if (req.headers.authorization) {
        let token = req.headers.authorization.split(" ")[1];
        if (token != null) {
            jwt.verify(token, jwtTokenUser, (err, payload) => {
                if (payload) {
                    let userid = payload.subject;
                    req.userId = userid;
                    next();
                } else {
                    res.status(401).json({ status: false, message: "Unauthorized" });
                }
            });
        } else {
            res.status(401).json({ status: false, message: "Unauthorized" });
        }
    } else {
        res.status(401).json({ status: false, message: "Unauthorized" });
    }
};

const jwtDecode = (token) => {
    try {
        var decoded = jwt_decode(token, jwtTokenUser);
        return decoded;
    } catch (error) {
        return error
    }

};

exports.encrypt = (value) => {
    let cipher = crypto.createCipheriv(algorithm, password,iv);
    let crypted = cipher.update(value, "utf8", "hex");
    crypted += cipher.final("hex");
    return crypted;
};

exports.decrypt = (value) => {
    let decipher = crypto.createDecipheriv(algorithm, password,iv);
    let dec = decipher.update(value, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
};

//user sign
exports.requireSignin = (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        const user = jwt.verify(token, keyfile.JWT_SECREAT);
        req.user = user;
    } else {
        return res.status(400).json({ message: "Authorization required" });
    }
    next();
};