'use client';

import React, { useState, useEffect } from 'react';
import { Users, Layout, Shield, Trash2, Edit3, Check, X, Search, Plus, ExternalLink, MessageSquare, Send, XCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { backendService } from '@/services/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('projects');
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchingFor, setSearchingFor] = useState(null);

    const [selectedProject, setSelectedProject] = useState(null);
    const [projectComments, setProjectComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [filterMyComments, setFilterMyComments] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log("Fetching data...");
            const [projectsRes, usersRes] = await Promise.all([
                backendService.getAdminProjects(),
                backendService.getUsers(),
            ]);
            console.log({ projectsRes });

            const allProjects = projectsRes?.data || [];
            const allUsers = usersRes?.data || [];

            setUsers(allUsers);
            setProjects(allProjects);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateStatus = async (projectId, status) => {
        try {
            await backendService.adminUpdateProject(projectId, { status });
            toast.success(`Project status updated to ${status}`);
            fetchData();

            // Update modal state if open
            if (selectedProject) {
                const currentId = selectedProject.project?.id || selectedProject.id;
                if (currentId === projectId) {
                    if (selectedProject.project) {
                        setSelectedProject({
                            ...selectedProject,
                            project: { ...selectedProject.project, status }
                        });
                    } else {
                        setSelectedProject({ ...selectedProject, status });
                    }
                }
            }
        } catch (err) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const handleDeleteProject = async (id) => {
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await backendService.deleteProject(id);
                toast.success('Project deleted');
                fetchData();
            } catch (err) {
                toast.error(err.message);
            }
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await backendService.updateUser(userId, { role: newRole });
            toast.success("User role updated");
            fetchData();
        } catch (err) {
            toast.error("Failed to update role");
        }
    };

    const handleSearch = async (val) => {
        setSearchTerm(val);
        if (val.length > 2) {
            try {
                const results = await backendService.searchUsersByEmail(val);
                setSearchResults(results.filter(u => u.role === (searchingFor === 'mentor' ? 'mentor' : 'student')));
            } catch (err) {
                console.error(err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleUpdateMentor = (projectId, mentor) => {
        setEditingProject({
            ...editingProject,
            mentor,
            mentorId: mentor.id
        });
        toast.success(`Mentor set to ${mentor.name} (Save to apply)`);
    };

    const handleRemoveMentor = (projectId) => {
        setEditingProject({
            ...editingProject,
            mentor: null,
            mentorId: null
        });
        toast.success("Mentor cleared (Save to apply)");
    };

    const handleAddMember = (projectId, student) => {
        if (editingProject.students.some(s => s.id === student.id)) {
            toast.error("Student is already added");
            return;
        }
        if (editingProject.students.length >= 4) {
            toast.error("Maximum 4 members allowed");
            return;
        }

        setEditingProject({
            ...editingProject,
            students: [...editingProject.students, student]
        });
        toast.success(`${student.name} added to list (Save to apply)`);
    };

    const handleRemoveMember = (projectId, studentId) => {
        setEditingProject({
            ...editingProject,
            students: editingProject.students.filter(s => s.id !== studentId)
        });
        toast.success("Member removed from list (Save to apply)");
    };

    const handleOpenEdit = async (project) => {
        try {
            const res = await backendService.getProjectById(project.id);
            if (res?.data) {
                const rawData = res.data;
                const projectData = rawData.project || rawData;
                const students = rawData.students || rawData.users || projectData.students || projectData.users || [];

                // Helper to format date for input[type="date"]
                const formatDateForInput = (d) => {
                    if (!d) return '';
                    try {
                        const date = new Date(d);
                        if (isNaN(date.getTime())) return '';
                        return date.toISOString().split('T')[0];
                    } catch (e) {
                        return '';
                    }
                };

                setEditingProject({
                    ...projectData,
                    id: projectData.id || rawData.id,
                    startDate: formatDateForInput(projectData.startDate),
                    submissionDate: formatDateForInput(projectData.submissionDate),
                    students
                });
            } else {
                setEditingProject({ ...project, students: project.students || project.users || [] });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load project details for editing");
            setEditingProject({ ...project, students: project.students || project.users || [] });
        }
    };

    const handleSaveProjectInfo = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: editingProject.title,
                description: editingProject.description,
                techStack: editingProject.techStack,
                course: editingProject.course,
                semester: editingProject.semester,
                section: editingProject.section,
                startDate: editingProject.startDate,
                submissionDate: editingProject.submissionDate,
                mentorId: editingProject.mentorId,
                students: editingProject.students.map(s => s.id) // Sending array of student IDs
            };

            await backendService.adminUpdateProject(editingProject.id, payload);
            toast.success("Project updated successfully");
            setEditingProject(null);
            fetchData();
        } catch (err) {
            toast.error(err.message || "Failed to update project");
        }
    };

    const handleViewDetails = async (project) => {
        try {
            setSelectedProject(project);
            setProjectComments([]);
            setLoadingComments(true);
            setFilterMyComments(false);

            const detailResponse = await backendService.getProjectById(project.id);
            let fullProjectData = project;

            if (detailResponse?.data) {
                fullProjectData = detailResponse.data;
                setSelectedProject(fullProjectData);
            }

            fetchComments(project.id, fullProjectData);
        } catch (err) {
            console.error(err);
            setLoadingComments(false);
            toast.error("Failed to load project details");
        }
    };

    const fetchComments = async (projectId, projectData) => {
        setLoadingComments(true);
        try {
            const response = await backendService.getComments(projectId);
            const rawComments = response?.data || [];

            const enriched = rawComments.map(comment => {
                if (comment.userId === users?.[0]?.id) { // Simple check, better to match from auth but admin can see all
                    return { ...comment, userName: 'You' };
                }
                const member = projectData.users?.find(u => u.id === comment.userId);
                if (member) return { ...comment, userName: member.name, role: member.role || 'Member' };
                if (projectData.mentor?.id === comment.userId) return { ...comment, userName: projectData.mentor.name, role: 'Mentor' };
                return { ...comment, userName: 'User', role: '' };
            });

            setProjectComments(enriched);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const currentId = selectedProject.project?.id || selectedProject.id;
            await backendService.addComment({
                projectId: currentId,
                text: newComment,
            });
            fetchComments(currentId, selectedProject);
            setNewComment('');
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await backendService.deleteComment(commentId);
            toast.success('Comment deleted');
            const currentId = selectedProject.project?.id || selectedProject.id;
            fetchComments(currentId, selectedProject);
        } catch (err) {
            toast.error('Failed to delete comment');
        }
    };

    const filteredComments = filterMyComments
        ? projectComments.filter(c => c.userId === users?.[0]?.id) // Basic matching
        : projectComments;
    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <div className="admin-dashboard">
            <div className="tab-switcher">
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                >
                    <Layout size={18} />
                    Manage Projects
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                >
                    <Users size={18} />
                    Manage Users
                </button>
            </div>

            <div className="table-container glass-card">
                {activeTab === 'projects' ? (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Course & Details</th>
                                {/* <th>Mentor</th> */}
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <p className="font-bold">{p.title}</p>
                                        <p className="text-muted text-xs truncate max-w-xs">{p.techStack}</p>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <p className="font-semibold text-sm">{p.course}</p>
                                            <p className="text-muted text-xs">{p.semester}</p>
                                            <p className="text-muted-xs">Section {p.section}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${p.status}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => handleOpenEdit(p)} className="btn-icon edit" title="Edit Project"><Edit3 size={16} /></button>

                                            {/* Status Actions */}
                                            {p.status === 'submitted' && (
                                                <button onClick={() => handleUpdateStatus(p.id, 'pending')} className="btn-icon approve" title="Approve Submission"><Check size={16} /></button>
                                            )}
                                            {p.status === 'pending' && (
                                                <button onClick={() => handleUpdateStatus(p.id, 'approved')} className="btn-icon approve" title="Approve Project"><Check size={16} /></button>
                                            )}
                                            {p.status === 'approved' && (
                                                <button onClick={() => handleUpdateStatus(p.id, 'completed')} className="btn-icon approve" title="Mark Completed"><CheckCircle size={16} /></button>
                                            )}
                                            {(p.status === 'pending' || p.status === 'submitted' || p.status === 'approved') && (
                                                <button onClick={() => handleUpdateStatus(p.id, 'rejected')} className="btn-icon reject" title="Reject"><X size={16} /></button>
                                            )}

                                            <button onClick={() => handleViewDetails(p)} className="btn-icon" title="View Details"><ExternalLink size={16} /></button>
                                            <button onClick={() => handleDeleteProject(p.id)} className="btn-icon delete" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <p className="font-bold">{u.name}</p>
                                        <p className="text-muted text-xs">{u.email}</p>
                                    </td>
                                    <td className="capitalize">{u.role}</td>
                                    <td>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className="select-input"
                                        >
                                            <option value="student">Student</option>
                                            <option value="mentor">Mentor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Member Management Modal */}
            <AnimatePresence>
                {editingProject && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content"
                        >
                            <div className="modal-header">
                                <div className="flex-col">
                                    <h3>Edit Project</h3>
                                    <p className="text-muted text-[10px] uppercase font-bold tracking-wider">Project ID: {editingProject.id}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => { setEditingProject(null); setSearchingFor(null); setSearchTerm(''); setSearchResults([]); }} className="close-btn">&times;</button>
                                </div>
                            </div>

                            <div className="modal-body p-0">
                                <form onSubmit={handleSaveProjectInfo} className="p-10">
                                    <div className="space-y-12">
                                        {/* Project Details Section */}
                                        <section>
                                            <h4 className="section-title-v2 mb-6"><Layout size={18} className="text-primary" /> Project Information</h4>
                                            <div className="grid-2 gap-x-12 gap-y-10">
                                                <div className="form-group col-span-2">
                                                    <label className="form-label-v2">Project Title</label>
                                                    <input
                                                        type="text"
                                                        className="input-v2"
                                                        placeholder="Enter project title"
                                                        value={editingProject.title || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group col-span-2">
                                                    <label className="form-label-v2">Description</label>
                                                    <textarea
                                                        className="input-v2 min-h-[140px]"
                                                        placeholder="Detailed project description..."
                                                        value={editingProject.description || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label-v2">Tech Stack</label>
                                                    <input
                                                        type="text"
                                                        className="input-v2"
                                                        placeholder="e.g. React, Node.js, MongoDB"
                                                        value={editingProject.techStack || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, techStack: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label-v2">Course Name</label>
                                                    <input
                                                        type="text"
                                                        className="input-v2"
                                                        placeholder="e.g. Computer Science Capstone"
                                                        value={editingProject.course || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, course: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label-v2">Semester</label>
                                                    <input
                                                        type="text"
                                                        className="input-v2"
                                                        placeholder="e.g. Fall 2024"
                                                        value={editingProject.semester || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, semester: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label-v2">Section</label>
                                                    <input
                                                        type="text"
                                                        className="input-v2"
                                                        placeholder="e.g. Section A"
                                                        value={editingProject.section || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, section: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label-v2">Start Date</label>
                                                    <input
                                                        type="date"
                                                        className="input-v2"
                                                        value={editingProject.startDate || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label-v2">Submission Deadline</label>
                                                    <input
                                                        type="date"
                                                        className="input-v2"
                                                        value={editingProject.submissionDate || ''}
                                                        onChange={(e) => setEditingProject({ ...editingProject, submissionDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <div className="h-px bg-border w-full"></div>

                                        {/* Mentor Section */}
                                        <section className="modal-section-v2">
                                            <div className="flex-between mb-4">
                                                <h4 className="section-title-v2"><Shield size={18} className="text-primary" /> Project Mentor</h4>
                                                {!searchingFor && (
                                                    <button type="button" onClick={() => setSearchingFor('mentor')} className="btn-text text-primary text-xs font-bold uppercase tracking-wider">
                                                        {editingProject.mentor ? 'Change Mentor' : '+ Assign Mentor'}
                                                    </button>
                                                )}
                                            </div>

                                            {searchingFor === 'mentor' ? (
                                                <div className="search-interface glass-card p-4">
                                                    <div className="search-group">
                                                        <Search className="search-icon" size={16} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search mentor by email..."
                                                            className="input pl-10 w-full"
                                                            value={searchTerm}
                                                            onChange={(e) => handleSearch(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button type="button" onClick={() => { setSearchingFor(null); setSearchTerm(''); }} className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"><X size={16} /></button>
                                                    </div>
                                                    {searchResults.length > 0 && (
                                                        <div className="search-results-mini-v2 mt-2 max-h-[160px] overflow-y-auto">
                                                            {searchResults.map(u => (
                                                                <div key={u.id} className="result-item-mini flex-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="avatar-xs">{(u.name || u.email)[0]}</div>
                                                                        <div>
                                                                            <p className="font-semibold text-xs">{u.name}</p>
                                                                            <p className="text-muted text-[10px]">{u.email}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button type="button" onClick={() => { handleUpdateMentor(editingProject.id, u); setSearchingFor(null); setSearchTerm(''); }} className="btn btn-primary btn-xs">Assign</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : editingProject.mentor ? (
                                                <div className="selection-item-v2 flex-between p-4 bg-primary/5 rounded-xl border border-primary/10 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="avatar-small shadow-sm ring-2 ring-white">
                                                            {editingProject.mentor.name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-main">{editingProject.mentor.name}</p>
                                                            <p className="text-muted text-xs">{editingProject.mentor.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="badge-mentor border border-primary/20 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full group-hover:hidden">ASSIGNED MENTOR</div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMentor(editingProject.id)}
                                                            className="btn-icon text-error-light hidden group-hover:flex p-2 hover:bg-error/10 rounded-full"
                                                            title="Remove Mentor"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="empty-selection p-8 text-center bg-muted/30 rounded-xl border-2 border-dashed border-muted">
                                                    <p className="text-muted text-sm">No mentor assigned to this project.</p>
                                                </div>
                                            )}
                                        </section>

                                        <div className="h-px bg-border w-full"></div>

                                        {/* Students Section */}
                                        <section className="modal-section-v2 mt-8">
                                            <div className="flex-between mb-4">
                                                <h4 className="section-title-v2"><Users size={18} className="text-primary" /> Student Members ({(editingProject.students || []).length}/4)</h4>
                                                {(editingProject.students || []).length < 4 && !searchingFor && (
                                                    <button type="button" onClick={() => setSearchingFor('member')} className="btn-text text-primary text-xs font-bold uppercase tracking-wider">
                                                        + Add Member
                                                    </button>
                                                )}
                                            </div>

                                            {searchingFor === 'member' && (
                                                <div className="search-interface glass-card p-4 mb-4">
                                                    <div className="search-group">
                                                        <Search className="search-icon" size={16} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search student by email..."
                                                            className="input pl-10 w-full"
                                                            value={searchTerm}
                                                            onChange={(e) => handleSearch(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button type="button" onClick={() => { setSearchingFor(null); setSearchTerm(''); }} className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"><X size={16} /></button>
                                                    </div>
                                                    {searchResults.length > 0 && (
                                                        <div className="search-results-mini-v2 mt-2 max-h-[160px] overflow-y-auto">
                                                            {searchResults.map(u => (
                                                                <div key={u.id} className="result-item-mini flex-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="avatar-xs">{(u.name || u.email)[0]}</div>
                                                                        <div>
                                                                            <p className="font-semibold text-xs">{u.name}</p>
                                                                            <p className="text-muted text-[10px]">{u.email}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button type="button" onClick={() => { handleAddMember(editingProject.id, u); setSearchingFor(null); setSearchTerm(''); }} className="btn btn-primary btn-xs">Add</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid-2 gap-4">
                                                {(editingProject.students || []).map(s => (
                                                    <div key={s.id} className="selection-item-v2 flex-between p-3 bg-surface rounded-xl border border-border group hover:border-primary/30 hover:shadow-sm transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar-mini-v2 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                                                                {s.name?.[0] || '?'}
                                                            </div>
                                                            <div className="max-w-[120px]">
                                                                <p className="font-bold text-xs truncate">{s.name}</p>
                                                                <p className="text-muted text-[10px] truncate">{s.email}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMember(editingProject.id, s.id)}
                                                            className="btn-icon text-error-light opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-error/10 rounded-full"
                                                            title="Remove Member"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(editingProject.students || []).length === 0 && !searchingFor && (
                                                    <div className="col-span-2 py-6 text-center border-2 border-dashed border-muted rounded-xl">
                                                        <p className="text-muted text-sm">No students assigned to this project.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="modal-footer mt-12 bg-gray-50 -mx-10 -mb-10 p-10 flex justify-end gap-4 rounded-b-3xl border-t">
                                        <button type="button" onClick={() => setEditingProject(null)} className="btn btn-ghost px-8">Cancel</button>
                                        <button type="submit" className="btn btn-primary px-12 py-3 rounded-xl shadow-lg font-bold">Save All Changes</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Project Details Modal */}
                {selectedProject && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="modal-content detail-modal"
                        >
                            <div className="detail-layout">
                                {/* Project Info Section */}
                                <div className="detail-info">
                                    <div className="detail-header">
                                        <select
                                            value={selectedProject.project?.status || selectedProject.status}
                                            onChange={(e) => handleUpdateStatus(selectedProject.project?.id || selectedProject.id, e.target.value)}
                                            className={`badge badge-${selectedProject.project?.status || selectedProject.status} border-none outline-none cursor-pointer`}
                                        >
                                            <option value="pending">PENDING</option>
                                            <option value="approved">APPROVED</option>
                                            <option value="rejected">REJECTED</option>
                                            <option value="completed">COMPLETED</option>
                                            <option value="submitted">SUBMITTED</option>
                                        </select>
                                        <button onClick={() => setSelectedProject(null)} className="close-btn mobile-only">&times;</button>
                                    </div>
                                    <h2 className="detail-title">{selectedProject.project?.title || selectedProject.title}</h2>
                                    <p className="detail-desc">{selectedProject.project?.description || selectedProject.description}</p>

                                    <div className="grid-2 detail-stats">
                                        <div>
                                            <p className="label-muted">Tech Stack</p>
                                            <p className="value">{selectedProject.project?.techStack || selectedProject.techStack}</p>
                                        </div>
                                        <div>
                                            <p className="label-muted">Course & Semester</p>
                                            <p className="value">{selectedProject.project?.course || selectedProject.course} - {selectedProject.project?.semester || selectedProject.semester} Sem</p>
                                        </div>
                                        <div>
                                            <p className="label-muted">Submitted On</p>
                                            <p className="value">{new Date(selectedProject.project?.createdAt || selectedProject.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="label-muted">Deadline</p>
                                            <p className="value">{new Date(selectedProject.project?.submissionDate || selectedProject.submissionDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="team-section divider-top">
                                        <h3 className="section-title">
                                            <Shield size={16} />
                                            Team & Mentor
                                        </h3>
                                        <div className="mentor-card mt-4">
                                            <p className="label-muted">Assigned Mentor</p>
                                            <div className="user-profile-modal">
                                                <div className="avatar-small">
                                                    {selectedProject.mentor?.name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{selectedProject.mentor?.name || 'Not Assigned'}</p>
                                                    <p className="text-muted-xs">{selectedProject.mentor?.email || ''}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="team-list-section mt-6">
                                            <p className="label-muted">Student Members</p>
                                            <div className="member-grid mt-2">
                                                {selectedProject.users?.map(s => (
                                                    <div key={s.id} className="member-item glass-card">
                                                        <div className="avatar-mini">
                                                            {s.name ? s.name[0] : '?'}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-bold text-xs truncate">{s.name}</p>
                                                            <p className="text-muted-xs truncate">{s.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {!selectedProject.users?.length && (
                                                    <p className="text-muted-xs italic mt-2">No team members listed.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="detail-comments">
                                    <div className="comments-header">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <MessageSquare size={18} className="text-primary" />
                                                Comments
                                            </h3>
                                            <button
                                                onClick={() => setFilterMyComments(!filterMyComments)}
                                                className={`btn-filter ${filterMyComments ? 'active' : ''}`}
                                            >
                                                My Comments
                                            </button>
                                        </div>
                                        <button onClick={() => setSelectedProject(null)} className="close-btn desktop-only">&times;</button>
                                    </div>

                                    <div className="comments-body">
                                        {loadingComments ? (
                                            <div className="loading-state-mini">
                                                <div className="loader-mini"></div>
                                                <p>Loading discussions...</p>
                                            </div>
                                        ) : projectComments.length === 0 ? (
                                            <div className="empty-comments">
                                                <p className="text-muted">No comments yet.</p>
                                            </div>
                                        ) : (
                                            projectComments.map((comment) => (
                                                <div key={comment.id} className="comment-bubble-wrapper others">
                                                    <div className="comment-bubble">
                                                        <p className="comment-author">{comment.userName} {comment.role && `(${comment.role})`}</p>
                                                        <p className="comment-text">{comment.content || comment.text}</p>
                                                        <button
                                                            className="delete-comment-btn"
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            title="Delete Comment"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <span className="comment-date text-muted-xs mt-1">
                                                        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="comments-footer">
                                        <form onSubmit={handleAddComment} className="comment-form">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="input"
                                            />
                                            <button type="submit" className="btn-send">
                                                <Send size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </div>
    );
};

export default AdminDashboard;
