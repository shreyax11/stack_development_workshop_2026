import { and, eq, ilike, ne } from "drizzle-orm";
import enums from "../utils/enums.js";
import common from '../utils/common.js';
import postgreDb from "../config/sqlclient.js";
import { usersTable, projects, projectStudents, comments } from "../model/index.js";

export default class DatabaseService {
    static getUserById = async (userId) => {
        try{
            const user = await postgreDb.select().from(usersTable).where(eq(usersTable.id, userId));
            if(user.length === 0){
                throw new Error(`User with ID ${userId} not found`);
            }
            return user[0];
        }   
        catch(error){
            throw new Error(`Error fetching user by ID: ${error?.message}`);
        } 
    }

    static getUserByEmail = async (email) => {
        try{
            const user = await postgreDb.select().from(usersTable).where(ilike(usersTable.email, `%${email}%`));
            if(user.length) return user[0];
            return null;
        }   
        catch(error){
            throw new Error(`Error fetching user by email: ${error?.message}`);
        }
    }

    static getAllUsers = async () => {
        try{
            const users = await postgreDb.select().from(usersTable).where(
                ne(usersTable.status, enums.USER_STATUS.BANNED)
            );
            return users;
        }
        catch(error){
            throw new Error(`Error fetching mentor by name: ${error?.message}`);
        } 
    }



    static getMentorByEmail = async (email) => {
        try{
            const user = await postgreDb.select().from(usersTable).where(
                ilike(usersTable.email, `%${email}%`),
                eq(usersTable.role, enums.USER_ROLES.MENTOR)
            );
            if(user.length === 0){
                throw new Error(`Mentor with email ${email} not found`);
            }
            return user[0];
        }   
        catch(error){
            throw new Error(`Error fetching mentor by email: ${error?.message}`);
        }
    }

    static createUser = async (userData) => {
        try{
            const passwordHash = common.hashPassword(userData.password);
            userData.password = passwordHash;
            const [newUser] = await postgreDb.insert(usersTable).values(userData).returning();
            return newUser;
        }
        catch(error){
            throw new Error(`Error creating user: ${error?.message}`);
        }
    }

    // Project related methods

    static createProject = async (projectData, ownerId, teammates = []) => {
        // Implementation for creating a project in the database
        try{
            await postgreDb.transaction(async (trx) => {
                console.log('Creating project with data:', projectData, 'Owner ID:', ownerId, 'Teammates:', teammates);
                const [newProject] = await trx.insert(projects).values({...projectData, startDate: new Date(projectData.startDate), submissionDate: new Date(projectData.submissionDate)}).returning();
                console.log('Newly created project:', newProject);
                const projectId = newProject.id;
                const uniqueTeammates = Array.from(new Set(teammates.map(t => t.id))).map(id => teammates.find(t => t.id === id));
                for(const teammate of uniqueTeammates){
                    if(teammate.id === ownerId){
                        continue; // Skip adding the owner as a teammate since they will be added as a leader
                    }
                    await trx.insert(projectStudents).values({
                        projectId,
                        studentId: teammate.id,
                        isLeader: false
                    });
                }
                await trx.insert(projectStudents).values({
                    projectId,
                    studentId: ownerId,
                    isLeader: true
                });
                return newProject;
            });
        }
        catch(error){
            throw new Error(`Error creating project: ${error?.message}`);
        }
    }

    static getStudentProjects = async (studentId) => {
        // Implementation for retrieving projects for a specific student
        try{
            const data = await postgreDb.select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                status: projects.status,
                mentorId: projects.mentorId,
                techStack: projects.techStack,
                course: projects.course,
                semester: projects.semester,
                section: projects.section,
                startDate: projects.startDate,
                submissionDate: projects.submissionDate,
                createdAt: projects.createdAt,
                updatedAt: projects.updatedAt
            }).from(projects)
            .innerJoin(projectStudents, eq(projects.id, projectStudents.projectId))
            .where(eq(projectStudents.studentId, studentId));
            return data;
        }
        catch(error){
            throw new Error(`Error fetching student projects: ${error?.message}`);
        }
    }

    static getMentorProjects = async (mentorId) => {
        // Implementation for retrieving projects for a specific mentor
        try{
            const data = await postgreDb.select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                status: projects.status,
                techStack: projects.techStack,
                course: projects.course,
                semester: projects.semester,
                section: projects.section,
                startDate: projects.startDate,
                submissionDate: projects.submissionDate,
                createdAt: projects.createdAt,
                updatedAt: projects.updatedAt
            }).from(projects)
            .where(
                and(eq(projects.mentorId, mentorId),
                ne(projects.status, enums.PROJECT_STATUS.DELETED)
            )
            );
            return data;
        }
        catch(error){
            throw new Error(`Error fetching mentor projects: ${error?.message}`);
        }
    }

    static getProjectInfo = async (id) => {
        // Implementation for retrieving all projects from the database
        try{
            const project = await postgreDb.select().from(projects).where(and(eq(projects.id, id), ne(projects.status, enums.PROJECT_STATUS.DELETED)));

            console.log('Fetched project:', project);

            if(!project.length) throw new Error('project not found');

            const users = await postgreDb.select(
                {
                    id: usersTable.id,
                    name: usersTable.name,
                    email: usersTable.email,
                    role: usersTable.role
                }
            ).from(projectStudents)
            .innerJoin(usersTable,eq(usersTable.id,projectStudents.studentId))
            .where(eq(projectStudents.projectId,project[0].id));

            console.log('Users associated with the project:', users);

            const mentorArr = await postgreDb.select({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                role: usersTable.role
            })
            .from(projects)
            .innerJoin(usersTable,eq(usersTable.id,projects.mentorId))
            .where(eq(projects.id, id))
            ;

            let mentor;
            if(mentorArr.length){
                mentor = mentorArr[0];
            }

            return {project: project[0], users, mentor};
        }
        catch(error){
            throw new Error(`Error fetching projects: ${error?.message}`);
        }
    }

    // comments

    static createComment = async (commentData) => {
        // Implementation for creating a comment in the database
        try{
            const [newComment] = await postgreDb.insert(comments).values(commentData).returning();
            return newComment;
        }
        catch(error){
            throw new Error(`Error creating comment: ${error?.message}`);
        }
    }

    static getProjectComments = async (projectId) => {
        // Implementation for retrieving comments for a specific project
        try{
            const data = await postgreDb.select().from(comments).where(
                and(eq(comments.projectId, projectId), ne(comments.status, enums.COMMENT_STATUS.DELETED))
            );
            return data;
        }
        catch(error){
            throw new Error(`Error fetching project comments: ${error?.message}`);
        }
    }

    static deleteComment = async (commentId, userId) => {
        // Implementation for deleting a comment (soft delete by changing status)
        try{
            const data = await postgreDb.update(comments).set({status: enums.COMMENT_STATUS.DELETED}).where(
                and(eq(comments.id, commentId), eq(comments.userId, userId))
            )
            .returning()
            ;

            if(data.length === 0){
                throw new Error('Comment not found or user not authorized to delete');
            }
        }
        catch(error){
            throw new Error(`Error deleting comment: ${error?.message}`);
        }
    }

    // admin services
    static getAllProjects = async ()=>{
        try{
            return await postgreDb
            .select()
            .from(projects)
            .where(ne(projects.status,enums.PROJECT_STATUS.DELETED));
        }
        catch(error){
            throw new Error(`Error getting all projects: ${error?.message}`);
        }
    }

    static getAllUsers = async ()=>{
        try{
            return await postgreDb
            .select()
            .from(usersTable);
        }
        catch(error){
            throw new Error(`Error while getting all users: ${error?.message}`);
        }
    }

    static updateUserById = async (userId, updateData)=>{
        try{
            if(updateData.password){
                const passwordHash = common.hashPassword(updateData.password);
                updateData.password = passwordHash;
            }
            const data = await postgreDb
            .update(usersTable)
            .set(updateData)
            .where(eq(usersTable.id, userId))
            .returning();

            if(data.length === 0){
                throw new Error('User not found');
            }
            delete data[0].password;
            return data[0];
        }
        catch(error){
            throw new Error(`Error while updating user: ${error?.message}`);
        }
    }

    static updateProjectById = async (projectId, updateData)=>{
        try{
            const data = await postgreDb
            .update(projects)
            .set(updateData)
            .where(eq(projects.id, projectId))
            .returning();

            if(data.length === 0){
                throw new Error('Project not found');
            }
            return data[0];
        }
        catch(error){
            throw new Error(`Error while updating project: ${error?.message}`);
        }
    }

    static updateCommentById = async (commentId, updateData)=>{
        try{
            const data = await postgreDb
            .update(comments)
            .set(updateData)
            .where(eq(comments.id,commentId))
            .returning()
            ;

            if(data.length === 0){
                throw new Error('Comment not found');
            }
            return data[0];
        }
        catch(error){
            throw new Error(`Error while updating comment by id: ${error?.message}`);
        }
}

    static updateStatusForMentor = async (projectId, updateData, mentorId)=>{
            try{
                const project = await postgreDb.select().from(projects).where(
                    and(eq(projects.id, projectId), eq(projects.mentorId, mentorId))
                );

                if(project.length === 0){
                    throw new Error('Project not found or mentor not authorized to update status');
                }
                const data = await postgreDb
                .update(projects)
                .set(updateData)
                .where(eq(projects.id, projectId))
                .returning();

                if(data.length === 0){
                    throw new Error('Project not found');
                }
                return data[0];
            }
            catch(error){
                throw new Error(`Error while updating project: ${error?.message}`);
            }
        }
}