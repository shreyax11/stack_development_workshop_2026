import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_NGROK_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'ngrok-skip-browser-warning': '69420'
    }
});

export const backendService = {
    // Auth
    login: async (email, password) => {
        try {
            const response = await api.post(`/user/login`, {
                email: email,
                password: password
            });
            console.log("Login response: ", response)
            return response.data;
        } catch (err) {
            console.log(`login error: ${err}`);
            throw err;
        }
    },
    signup: async (userData) => {
        try {
            const response = await api.post('/user/register', {
                name: userData.name, email: userData.email, password: userData?.password
            });
            console.log("Signup response: ", response)
            return response.data;
        } catch (err) {
            console.log(`signup error: ${err}`);
            throw err;
        }
    },

    // Users
    getUsers: async () => {
        const response = await api.get('/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    updateUser: async (id, userData) => {
        const response = await api.patch(`admin/user/${id}`, {
            role: userData?.role
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    searchMentorsByEmail: async (email) => {
        const response = await api.get(`/user/mentor?email=${email}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    searchStudentsByEmail: async (email) => {
        const response = await api.get(`/user/student?email=${email}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    // Projects
    getProjects: async () => {
        try {
            const response = await api.get('/project', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log("response on projects", response.data);
            return response.data;
        } catch (err) {
            console.log(`getProjects error: ${err}`);
            throw err;
        }
    },
    getProjectById: async (id) => {
        const response = await api.get(`/project/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    createProject: async (projectData) => {
        const response = await api.post('/project', projectData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    updateProject: async (id, projectData) => {
        const response = await api.patch(`/project/${id}`, {
            ...projectData,
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    adminUpdateProject: async (id, projectData) => {
        const response = await api.patch(`/admin/project/${id}`, projectData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    deleteProject: async (id) => {
        await api.delete(`/project/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    },
    getAdminProjects: async () => {
        const response = await api.get('/admin/projects', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    // Project Members
    getProjectMembers: async (projectId) => {
        const response = await api.get(`/project_students?projectId=${projectId}`);
        return response.data;
    },
    addProjectMember: async (memberData) => {
        const response = await api.post('/project_students', {
            ...memberData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return response.data;
    },
    removeProjectMember: async (id) => {
        await api.delete(`/project_students/${id}`);
    },


    // Comments
    getComments: async (projectId) => {
        const response = await api.get(`/project/comments?projectid=${projectId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    addComment: async (commentData) => {
        const response = await api.post('/project/comment', {
            projectId: commentData.projectId,
            content: commentData.text,
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
    deleteComment: async (commentId) => {
        const response = await api.patch(`/admin/comment/${commentId}`, {
            status: "deleted",
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },
};
