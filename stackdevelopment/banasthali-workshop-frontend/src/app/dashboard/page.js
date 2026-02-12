'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/authContext';
import { LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
import './../dashboard.css';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import MentorDashboard from '@/components/dashboards/MentorDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

const DashboardPage = () => {
    const { user, logout } = useAuth();

    const renderDashboard = () => {
        switch (user?.data?.role) {
            case 'student':
                return <StudentDashboard />;
            case 'mentor':
                return <MentorDashboard />;
            case 'admin':
                return <AdminDashboard />;
            default:
                return <div>Unauthorized Role</div>;
        }
    };

    return (
        <ProtectedRoute>
            <div className="dashboard-layout">
                <header className="main-header">
                    <div className="header-content">
                        <div className="brand">
                            <div className="brand-icon">
                                <LayoutDashboard size={24} />
                            </div>
                            <span className="brand-name">Project Portal</span>
                        </div>

                        <div className="user-nav">
                            <div className="user-profile">
                                <div className="user-info">
                                    <p className="user-name">{user?.data?.name}</p>
                                    <p className="user-role">{user?.data?.role}</p>
                                </div>
                                <div className="avatar">
                                    <UserIcon size={25} />
                                </div>
                            </div>
                            <button onClick={logout} className="logout-btn">
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    {renderDashboard()}
                </main>
            </div>
        </ProtectedRoute>
    );
};

export default DashboardPage;
