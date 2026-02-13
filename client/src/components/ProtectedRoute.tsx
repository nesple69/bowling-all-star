import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export const ProtectedAdminRoute: React.FC = () => {
    const { token, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!token) {
        console.log('ProtectedAdminRoute - No token, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    const isUserAdmin = isAdmin();
    console.log('ProtectedAdminRoute - Token present, isAdmin:', isUserAdmin);

    if (!isUserAdmin) {
        console.log('ProtectedAdminRoute - Not admin, redirecting to /');
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
