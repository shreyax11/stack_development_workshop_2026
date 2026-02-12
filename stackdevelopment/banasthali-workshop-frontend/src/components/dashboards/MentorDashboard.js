'use client';

import React, { useState, useEffect } from 'react';
import { backendService } from '@/services/api';
import { useAuth } from '@/context/authContext';
import { ClipboardList, CheckCircle, MessageSquare, ExternalLink, X, Send, XCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MentorDashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectComments, setProjectComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [filterMyComments, setFilterMyComments] = useState(false);

    useEffect(() => {
        fetchAssignedProjects();
    }, []);

    const fetchAssignedProjects = async () => {
        setLoading(true);
        try {
            const response = await backendService.getProjects();
            const allProjects = response?.data || [];
            // If the backend doesn't filter, we could filter here, but user implies 
            // the API now returns the correct list for the current mentor.
            setProjects(allProjects);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch projects");
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateStatus = async (projectId, newStatus) => {
        try {
            await backendService.updateProject(projectId, { status: newStatus });
            toast.success(`Project marked as ${newStatus}`);
            fetchAssignedProjects();

            // Update local state if the modal is open for this project
            const currentId = selectedProject?.project?.id || selectedProject?.id;
            if (currentId === projectId) {
                if (selectedProject?.project) {
                    setSelectedProject({
                        ...selectedProject,
                        project: { ...selectedProject.project, status: newStatus }
                    });
                } else {
                    setSelectedProject({ ...selectedProject, status: newStatus });
                }
            }
        } catch (err) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const handleViewDetails = async (project) => {
        try {
            setSelectedProject({ project, users: project.students || [] });
            setProjectComments([]); // Clear previous comments
            setLoadingComments(true);
            setFilterMyComments(false); // Reset filter

            const detailResponse = await backendService.getProjectById(project.id);
            let fullProjectData = { project, users: project.students || [] };

            if (detailResponse?.data) {
                fullProjectData = detailResponse.data;
                setSelectedProject(fullProjectData);
            }

            fetchComments(project.id, fullProjectData);
        } catch (err) {
            console.error(err);
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await backendService.addComment({
                projectId: selectedProject.project?.id || selectedProject.id,
                text: newComment,
            });

            // Re-fetch comments to get the latest list with proper IDs
            fetchComments(selectedProject.project?.id || selectedProject.id, selectedProject);
            setNewComment('');
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        }
    };

    const fetchComments = async (projectId, projectData) => {
        setLoadingComments(true);
        try {
            const response = await backendService.getComments(projectId);
            const rawComments = response?.data || [];

            // Enrich comments with author names from project members
            const enriched = rawComments.map(comment => {
                if (comment.userId === user?.data?.id) {
                    return { ...comment, userName: 'You', role: user?.data?.role };
                }
                const member = projectData.users?.find(u => u.id === comment.userId);
                if (member) {
                    return { ...comment, userName: member.name, role: member.role || 'Member' };
                }
                if (projectData.mentor?.id === comment.userId) {
                    return { ...comment, userName: projectData.mentor.name, role: 'Mentor' };
                }
                return { ...comment, userName: 'Team Member', role: '' };
            });

            setProjectComments(enriched);
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const filteredComments = filterMyComments
        ? projectComments.filter(c => c.userId === user?.data?.id)
        : projectComments;

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <div className="mentor-dashboard">
            <div className="section-header">
                <div>
                    <h2 className="dashboard-title">Mentor Dashboard</h2>
                    <p className="text-muted">Monitoring {projects.length} assigned projects</p>
                </div>
            </div>

            <div className="table-container glass-card">
                {loading ? (
                    <div className="loading-projects">
                        <div className="loader"></div>
                        <p>Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="empty-state py-12">
                        <ClipboardList size={64} className="text-primary mb-4" />
                        <h3 className="text-xl font-bold">No Projects Assigned</h3>
                        <p className="text-muted">You don't have any projects assigned to you at the moment.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Project Title</th>
                                <th>Course & Sem</th>
                                <th>Deadline</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <p className="font-bold">{project.title}</p>
                                        <p className="text-muted text-xs">Stack: {project.techStack}</p>
                                    </td>
                                    <td>
                                        <p className="text-sm">{project.course}</p>
                                        <p className="text-muted text-xs">{project.semester}</p>
                                    </td>
                                    <td>
                                        <span className="text-sm">{new Date(project.submissionDate).toLocaleDateString()}</span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${project.status}`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {project.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(project.id, 'approved')}
                                                        className="btn-icon approve"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(project.id, 'rejected')}
                                                        className="btn-icon reject"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {project.status === 'approved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(project.id, 'completed')}
                                                    className="btn-icon approve"
                                                    title="Mark as Completed"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewDetails(project)}
                                                className="btn-icon"
                                                title="View Details"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Project Details Modal */}
            <AnimatePresence>
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
                                        <span className={`badge badge-${selectedProject.project?.status || selectedProject.status}`}>
                                            {selectedProject.project?.status || selectedProject.status}
                                        </span>
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
                                                    {(selectedProject.mentor?.name || user?.data?.name)?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{selectedProject.mentor?.name || user?.data?.name || 'Not Assigned'}</p>
                                                    <p className="text-muted-xs">{selectedProject.mentor?.email || user?.data?.email || ''}</p>
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

                                    {(selectedProject.project?.status === 'pending' || selectedProject.status === 'pending') && (
                                        <div className="action-row divider-top">
                                            <button
                                                onClick={() => handleUpdateStatus(selectedProject.project?.id || selectedProject.id, 'approved')}
                                                className="btn btn-primary btn-success flex-1"
                                            >
                                                Approve Project
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedProject.project?.id || selectedProject.id, 'rejected')}
                                                className="btn btn-outline btn-danger flex-1"
                                            >
                                                Reject Project
                                            </button>
                                        </div>
                                    )}

                                    {(selectedProject.project?.status === 'approved' || selectedProject.status === 'approved') && (
                                        <div className="action-row divider-top">
                                            <button
                                                onClick={() => handleUpdateStatus(selectedProject.project?.id || selectedProject.id, 'completed')}
                                                className="btn btn-primary btn-success w-full"
                                            >
                                                Mark as Completed
                                            </button>
                                        </div>
                                    )}
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
                                        ) : filteredComments.length === 0 ? (
                                            <div className="empty-comments">
                                                <p className="text-muted">{filterMyComments ? "You haven't commented yet." : "No comments yet."}</p>
                                            </div>
                                        ) : (
                                            filteredComments.map((comment) => (
                                                <div key={comment.id} className={`comment-bubble-wrapper ${comment.userId === user?.data?.id ? 'mine' : 'others'}`}>
                                                    <div className="comment-bubble">
                                                        <p className="comment-author">{comment.userName} {comment.role && `(${comment.role})`}</p>
                                                        <p className="comment-text">{comment.content || comment.text}</p>
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

export default MentorDashboard;
