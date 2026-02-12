'use client';

import React, { useState, useEffect } from 'react';
import { backendService } from '@/services/api';
import { useAuth } from '@/context/authContext';
import { Plus, Clock, MessageSquare, PlusCircle, Users, Search, X, UserPlus, Send, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const COURSE_DATA = {
    'BCA': ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI'],
    'BTech(CS)': ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'],
    'BTech(IT)': ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'],
    'MTech(CS)': ['Semester I', 'Semester II', 'Semester III', 'Semester IV'],
    'MTech(IT)': ['Semester I', 'Semester II', 'Semester III', 'Semester IV'],
    'MCA': ['Semester I', 'Semester II', 'Semester III', 'Semester IV'],
    'MSc': ['Semester I', 'Semester II', 'Semester III', 'Semester IV']
};

const SECTIONS = ['A', 'B', 'C', 'D'];

const StudentDashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        techStack: '',
        course: '',
        semester: '',
        section: '',
        startDate: '',
        submissionDate: '',
    });
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectComments, setProjectComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [mentorSearch, setMentorSearch] = useState({ term: '', results: [], loading: false });
    const [memberSearch, setMemberSearch] = useState({ term: '', results: [], loading: false });
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [filterMyComments, setFilterMyComments] = useState(false);


    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
            const response = await backendService.getProjects();
            const allProjects = Array.isArray(response?.data) ? response.data : [];
            setProjects(allProjects);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch projects");
        } finally {
            setLoadingProjects(false);
        }
    };


    const handleMentorSearch = async (val) => {
        setMentorSearch(prev => ({ ...prev, term: val }));
        if (val.length > 2) {
            try {
                const response = await backendService.searchMentorsByEmail(val);
                setMentorSearch(prev => ({ ...prev, results: response?.data || [] }));
            } catch (err) {
                console.error(err);
                setMentorSearch(prev => ({ ...prev, results: [] }));
            }
        } else {
            setMentorSearch(prev => ({ ...prev, results: [] }));
        }
    };

    const handleMemberSearch = async (val) => {
        setMemberSearch(prev => ({ ...prev, term: val }));
        if (val.length > 2) {
            try {
                const response = await backendService.searchStudentsByEmail(val);
                setMemberSearch(prev => ({ ...prev, results: response?.data || [] }));
            } catch (err) {
                console.error(err);
                setMemberSearch(prev => ({ ...prev, results: [] }));
            }
        } else {
            setMemberSearch(prev => ({ ...prev, results: [] }));
        }
    };

    const handleAddMember = (stu) => {
        if (selectedMembers.length >= 4) {
            toast.error('Maximum 4 members allowed');
            return;
        }
        if (selectedMembers.find(m => m.id === stu.id)) {
            toast.error('Member already added');
            return;
        }
        setSelectedMembers([...selectedMembers, stu]);
        setMemberSearch({ term: '', results: [], loading: false });
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!selectedMentor) {
            toast.error('Please select a mentor');
            return;
        }
        try {
            const projectData = {
                ...newProject,
                startDate: newProject.startDate ? new Date(newProject.startDate).getTime() : null,
                submissionDate: newProject.submissionDate ? new Date(newProject.submissionDate).getTime() : null,
                mentorId: selectedMentor.id,
                teammates: [
                    ...selectedMembers,
                    user?.data // Including the current user as well if needed, or follow instructions exactly
                ]
            };

            await backendService.createProject(projectData);

            toast.success('Project created successfully and submitted for approval');
            setShowAddModal(false);
            fetchProjects();
            resetForm();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const resetForm = () => {
        setNewProject({
            title: '',
            description: '',
            techStack: '',
            course: '',
            semester: '',
            section: '',
            startDate: '',
            submissionDate: '',
        });
        setSelectedMembers([]);
        setSelectedMentor(null);
        setMentorSearch({ term: '', results: [] });
        setMemberSearch({ term: '', results: [] });
    };

    const handleViewDetails = async (project) => {
        try {
            setSelectedProject({ project });
            setProjectComments([]); // Clear previous comments
            setLoadingComments(true);
            setFilterMyComments(false); // Reset filter

            const detailResponse = await backendService.getProjectById(project.id);
            let fullProjectData = { project };

            if (detailResponse?.data) {
                fullProjectData = detailResponse.data;
                setSelectedProject(fullProjectData);
            }

            fetchComments(project.id, fullProjectData);
        } catch (err) {
            console.error("Error fetching project details:", err);
            setLoadingComments(false);
            toast.error("Failed to load project details");
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const response = await backendService.addComment({
                projectId: selectedProject.project.id,
                text: newComment, // This will be sent as 'content' by the service
            });

            // The API likely returns the comment. We can enrich it locally for the UI
            const newCommentObj = response?.data || response;
            if (newCommentObj && newCommentObj.id) {
                setProjectComments([...projectComments, {
                    ...newCommentObj,
                    userName: user?.data?.name,
                    role: user?.data?.role
                }]);
            } else {
                fetchComments(selectedProject.project.id, selectedProject);
            }

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
                    return { ...comment, userName: member.name, role: member.role };
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


    return (
        <div className="student-dashboard">
            <div className="section-header">
                <div>
                    <h2 className="dashboard-title">My Projects</h2>
                    <p className="text-muted">Manage and track your academic projects</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <Plus size={20} />
                    Create New Project
                </button>
            </div>

            <div className="project-grid">
                {loadingProjects ? (
                    <div className="loading-projects glass-card">
                        <div className="loader"></div>
                        <p>Fetching your projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="empty-state glass-card col-span-full">
                        <PlusCircle size={64} className="text-primary mb-4" />
                        <h3 className="text-xl font-bold">No Projects Found</h3>
                        <p className="text-muted mb-6">You haven't created any projects yet. Start by proposing your first project.</p>
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                            <Plus size={20} />
                            Create New Project
                        </button>
                    </div>
                ) : (
                    projects.map((project) => (
                        <motion.div
                            layout
                            key={project.id}
                            className="project-card glass-card"
                        >
                            <div className="project-card-header">
                                <span className={`badge badge-${project.status}`}>
                                    {project.status}
                                </span>
                                <div className="icon-muted">
                                    <Clock size={18} />
                                </div>
                            </div>

                            <h3 className="project-card-title">{project.title}</h3>
                            <p className="project-card-desc">{project.description}</p>

                            <div className="project-footer">
                                <div className="due-date">
                                    <Clock size={14} />
                                    <span>Due: {new Date(project.submissionDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewDetails(project)}
                                className="btn btn-outline w-full"
                            >
                                View Details
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Project Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-content"
                            style={{ maxWidth: '700px' }}
                        >
                            <div className="modal-header">
                                <h3>Create New Project</h3>
                                <button onClick={() => setShowAddModal(false)} className="close-btn">&times;</button>
                            </div>

                            <form onSubmit={handleCreateProject} className="modal-form-body">
                                <div className="form-section">
                                    <h4 className="form-sub-title">Basic Information</h4>
                                    <div className="grid-2">
                                        <div className="form-full">
                                            <label className="label">Project Title</label>
                                            <input required className="input" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} placeholder="E.g. Healthcare Management System" />
                                        </div>
                                        <div className="form-full">
                                            <label className="label">Project Description</label>
                                            <textarea rows={3} className="input" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder="Briefly describe your project goals..." />
                                        </div>
                                        <div>
                                            <label className="label">Tech Stack</label>
                                            <input className="input" value={newProject.techStack} onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })} placeholder="React, Node.js, etc." />
                                        </div>
                                        <div>
                                            <label className="label">Course</label>
                                            <select
                                                required
                                                className="input"
                                                value={newProject.course}
                                                onChange={(e) => setNewProject({ ...newProject, course: e.target.value, semester: '' })}
                                            >
                                                <option value="">Select Course</option>
                                                {Object.keys(COURSE_DATA).map(course => (
                                                    <option key={course} value={course}>{course}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Semester</label>
                                            <select
                                                required
                                                className="input"
                                                disabled={!newProject.course}
                                                value={newProject.semester}
                                                onChange={(e) => setNewProject({ ...newProject, semester: e.target.value })}
                                            >
                                                <option value="">Select Semester</option>
                                                {newProject.course && COURSE_DATA[newProject.course].map(sem => (
                                                    <option key={sem} value={sem}>{sem}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Section</label>
                                            <select
                                                required
                                                className="input"
                                                value={newProject.section}
                                                onChange={(e) => setNewProject({ ...newProject, section: e.target.value })}
                                            >
                                                <option value="">Select Section</option>
                                                {SECTIONS.map(sec => (
                                                    <option key={sec} value={sec}>{sec}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Start Date</label>
                                            <input type="date" className="input" value={newProject.startDate} onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Submission Deadline</label>
                                            <input type="date" className="input" value={newProject.submissionDate} onChange={(e) => setNewProject({ ...newProject, submissionDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h4 className="form-sub-title">Team & Mentor</h4>

                                    <div className="selection-container">
                                        <label className="label">Assigned Mentor</label>
                                        {selectedMentor ? (
                                            <div className="selection-item highlight">
                                                <div className="selection-info">
                                                    <div className="avatar-small">{selectedMentor.name[0]}</div>
                                                    <div>
                                                        <p className="font-bold text-sm">{selectedMentor.name}</p>
                                                        <p className="text-muted-xs">{selectedMentor.email}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setSelectedMentor(null)} className="btn-icon delete"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="search-group">
                                                <Search className="search-icon" size={16} />
                                                <input
                                                    type="text"
                                                    className="input pl-10"
                                                    placeholder="Search mentor by email..."
                                                    onChange={(e) => handleMentorSearch(e.target.value)}
                                                    value={mentorSearch.term}
                                                />
                                                {mentorSearch.results.length > 0 && (
                                                    <div className="search-results-dropdown">
                                                        {mentorSearch.results.map(u => (
                                                            <div key={u.id} onClick={() => { setSelectedMentor(u); setMentorSearch({ term: '', results: [] }); }} className="result-item">
                                                                <p className="font-bold text-sm">{u.name}</p>
                                                                <p className="text-muted-xs">{u.email}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="selection-container mt-4">
                                        <div className="flex-between mb-2">
                                            <label className="label">Team Members (Max 4)</label>
                                            <span className="text-muted-xs font-bold">{selectedMembers.length}/4</span>
                                        </div>

                                        <div className="selected-members-grid">
                                            {selectedMembers.map(m => (
                                                <div key={m.id} className="member-chip">
                                                    <div className="avatar-mini">{m.name[0]}</div>
                                                    <span className="text-xs font-bold truncate">{m.name.split(' ')[0]}</span>
                                                    <button type="button" onClick={() => setSelectedMembers(selectedMembers.filter(sm => sm.id !== m.id))} className="remove-btn"><X size={12} /></button>
                                                </div>
                                            ))}
                                        </div>

                                        {selectedMembers.length < 4 && (
                                            <div className="search-group mt-2">
                                                <Search className="search-icon" size={16} />
                                                <input
                                                    type="text"
                                                    className="input pl-10"
                                                    placeholder="Add member by email..."
                                                    onChange={(e) => handleMemberSearch(e.target.value)}
                                                    value={memberSearch.term}
                                                />
                                                {memberSearch.results.length > 0 && (
                                                    <div className="search-results-dropdown">
                                                        {memberSearch.results.map(u => (
                                                            <div key={u.id} onClick={() => handleAddMember(u)} className="result-item flex-between">
                                                                <div>
                                                                    <p className="font-bold text-sm">{u.name}</p>
                                                                    <p className="text-muted-xs">{u.email}</p>
                                                                </div>
                                                                <UserPlus size={16} className="text-primary" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="btn btn-ghost">
                                        Discard
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-large">
                                        Submit for Approval
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Project Details Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content detail-modal"
                        >
                            <div className="detail-layout">
                                {/* Project Info Section */}
                                <div className="detail-info">
                                    <div className="detail-header">
                                        <span className={`badge badge-${selectedProject.project?.status}`}>
                                            {selectedProject.project?.status}
                                        </span>
                                        <button onClick={() => setSelectedProject(null)} className="close-btn mobile-only">&times;</button>
                                    </div>
                                    <h2 className="detail-title">{selectedProject.project?.title}</h2>
                                    <p className="detail-desc">{selectedProject.project?.description}</p>

                                    <div className="grid-2 detail-stats">
                                        <div>
                                            <p className="label-muted">Tech Stack</p>
                                            <p className="value">{selectedProject.project?.techStack}</p>
                                        </div>
                                        <div>
                                            <p className="label-muted">Course & Semester</p>
                                            <p className="value">{selectedProject.project?.course} - {selectedProject.project?.semester}</p>
                                        </div>
                                        <div>
                                            <p className="label-muted">Submitted On</p>
                                            <p className="value">{new Date(selectedProject.project?.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="label-muted">Deadline</p>
                                            <p className="value">{new Date(selectedProject.project?.submissionDate).toLocaleDateString()}</p>
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

export default StudentDashboard;
