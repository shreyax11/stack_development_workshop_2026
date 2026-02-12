import express from "express";
import middleware from "../middleware/index.js";
import database from "../services/database.js";

const router = express.Router();

router.use("/", middleware.verifyAuthorization());

router.post("/", middleware.verifyStudentRole(), async (req, res) => {
    try {
        // Project creation logic here
        const { title, description, techStack, mentorId, course, semester, section, teammates, startDate, submissionDate } = req.body;
        const ownerId = req.user.id;
        const data = await database.createProject({ title, description, techStack, mentorId, course, semester, section, startDate, submissionDate }, ownerId, teammates);
        res.status(201).json({ message: "Project created successfully", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error creating project" });
    }
});

router.get("/", async (req, res) => {
    try {
        // Project listing logic here
        if (req.user.role === "student") {
            const data = await database.getStudentProjects(req.user.id);
            return res.json({ message: "Project list retrieved successfully", data });
        }
        else if (req.user.role === "mentor") {
            const data = await database.getMentorProjects(req.user.id);
            return res.json({ message: "Project list retrieved successfully", data });
        }
        else {
            return res.status(403).json({ message: "Forbidden" });
        }

    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving project list" });
    }
});

router.post("/comment", async (req, res) => {
    try {
        // Comment creation logic here
        const { projectId, content } = req.body;
        const userId = req.user.id;
        await database.createComment({ projectId, content, userId });
        res.status(201).json({ message: "Comment added successfully" });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error adding comment" });
    }
});

router.delete("/comment/:id", async (req, res) => {
    try {
        // Comment deletion logic here
        let commentId = req.params.id;
        if (!commentId) throw new Error('id is required');
        const userId = req.user.id;
        commentId = parseInt(commentId);
        await database.deleteComment(commentId, userId);
        res.status(201).json({ message: "Comment deleted successfully" });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error deleting comment" });
    }
});

router.get("/comments", async (req, res) => {
    try {
        // Comment listing logic here
        const { projectid } = req.query;
        const data = await database.getProjectComments(projectid);
        res.json({ message: "Comment list retrieved successfully", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving comment list" });
    }
});

router.patch('/:id',middleware.verifyMentorRole(), async (req, res)=>{
    try{
        let projectId = parseInt(req.params?.id);
        const userId = req.user.id;
        if(!projectId) throw new Error('id is required');
        const updateData = req.body;
        const data = await database.updateStatusForMentor(projectId, updateData, userId);
        res.status(200).json({ message: "Project updated successfully", data });
    }
    catch(error){
        res
            .status(500)
            .json({ message: error?.message || "Error updating project" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        // Project details retrieval logic here
        let id = req.params?.id;
        if (!id) throw new Error('id is required');
        id = parseInt(id);
        const data = await database.getProjectInfo(id);
        res.json({ message: "Project details retrieved successfully", data });
    } catch (error) {
        res
            .status(500)
            .json({ message: error?.message || "Error retrieving project details" });
    }
});

export default router;