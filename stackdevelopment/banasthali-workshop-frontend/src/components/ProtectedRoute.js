'use client';

import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-vh-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
