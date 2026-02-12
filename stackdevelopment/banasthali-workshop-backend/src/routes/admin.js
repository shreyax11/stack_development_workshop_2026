import express from "express";
import middleware from "../middleware/index.js";
import DatabaseService from "../services/database.js";

const router = express.Router();

// Define user-related routes here
router.use("/", middleware.verifyAuthAndAdminRole);

router.get('/projects', async (req, res) => {
    try {
        // Logic to retrieve all projects for admin
        const data = await DatabaseService.getAllProjects();
        res.status(200).json({ message: "List of all projects", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving projects" });
    }
});

router.get('/users', async (req, res) => {
    try {
        // Logic to retrieve all users for admin
        const data = await DatabaseService.getAllUsers();
        res.status(200).json({ message: "List of all users", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving users" });
    }
});

router.patch('/user/:id', async (req,res)=>{
    try{
        const userId = parseInt(req.params.id);
        const updateData = req.body;
        const data = await DatabaseService.updateUserById(userId, updateData);
        res.status(200).json({ message: "User updated successfully", data });
    }
    catch(error){
        res
            .status(500)
            .json({ message: error?.message || "Error updating user" });
    }
});

router.patch('/project/:id', async (req, res)=>{
    try{
        let projectId = parseInt(req.params?.id);
        if(!projectId) throw new Error('id is required');
        projectId = parseInt(projectId);
        const updateData = req.body;
        const data = await DatabaseService.updateProjectById(projectId, updateData);
        res.status(200).json({ message: "Project updated successfully", data });
    }
    catch(error){
        res
            .status(500)
            .json({ message: error?.message || "Error updating project" });
    }
});

router.patch('/comment/:id', async (req,res)=>{
    try{
        let id = req.params?.id;
        if(!id) throw new Error(`id is required`);
        id = parseInt(id);
        const updateData = req.body;
        const data = await DatabaseService.updateCommentById(id, updateData);
        res.status(200).json({ message: "Comment updated successfully", data });
    }
    catch(error){
        res
            .status(500)
            .json({ message: error?.message || "Error while updating comment" });
    }
})

export default router;