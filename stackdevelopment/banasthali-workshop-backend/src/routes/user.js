import express from "express";
import common from "../utils/common.js";
import database from "../services/database.js";
import middleware from "../middleware/index.js";
import enums from "../utils/enums.js";
import e from "express";

const router = express.Router();

// Define user-related routes here
router.post("/register", async (req, res) => {
    try {
        // Registration logic here
        const { name, password, email } = req.body;
        if(!email || !password || !name){
            return res.status(400).json({ message: "Name, email and password are required" });
        }
        const saveUser = {
            name,
            email: email.toLowerCase(),
            password: password
        }
        const existingUser = await database.getUserByEmail(saveUser.email);
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const data = await database.createUser(saveUser);
        delete data.password;
        const token = common.signPayload({
            id: data.id,
            email: data.email,
            role: data.role,
            type: enums.TOKEN_TYPES.ACCESS
        });
        res.status(201).json({ message: "User registered successfully", data,token });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error registering user" });
    }
});

router.post("/login", async (req, res) => {
    // Login logic here
    try {
        const { email, password } = req.body;
        const data = await database.getUserByEmail(email.toLowerCase());
        if (!data) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordValid = common.comparePassword(password, data.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        delete data.password;
        const token = common.signPayload({
            id: data.id,
            email: data.email,
            role: data.role,
            type: enums.TOKEN_TYPES.ACCESS
        });
        res.json({ message: "User logged in successfully", token, data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error logging in user" });
    }
});

router.get("/profile",middleware.verifyAuthAndStudentRole, async (req, res) => {
    try {
        // Profile retrieval logic here
        const user = req.user;
        const data = await database.getUserById(user.id);
        delete data.password;
        res.json({ message: "User profile data", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error fetching user profile" });
    }
});

router.get("/mentor", async (req, res) => {
    try {
        // Mentor listing logic here
        const { email } = req.query;
        if(!email){
            return res.status(400).json({ message: "Email query parameter is required" });
        }
        let data = [await database.getMentorByEmail(email.toLowerCase())];
        res.json({ message: "Mentor list retrieved successfully", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving mentor list" });
    }
});

router.get("/student", async (req, res) => {
    try {
        // Mentor listing logic here
        const { email } = req.query;
        if(!email){
            return res.status(400).json({ message: "Email query parameter is required" });
        }
        let data = [];
        const student = await database.getUserByEmail(email.toLowerCase());
        if(student){
            data.push(student);
        }
        res.json({ message: "Student retrieved successfully", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving student" });
    }
});

export default router;
