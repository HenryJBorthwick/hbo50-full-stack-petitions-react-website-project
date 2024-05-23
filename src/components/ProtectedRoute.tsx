import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useUserStore } from '../store/index';

interface ProtectedRouteProps {
    element: React.ReactElement;
    path: string;
    exact?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, ...rest }) => {
    const isAuthenticated = useUserStore(state => state.isAuthenticated);

    return (
        <Route
            {...rest}
            element={
                isAuthenticated() ? element : <Navigate to="/register" />
            }
        />
    );
};

export default ProtectedRoute;
