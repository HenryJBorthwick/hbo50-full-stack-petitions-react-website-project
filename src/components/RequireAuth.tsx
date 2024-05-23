import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = useUserStore((state) => state.user);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!user) {
            const pathName = window.location.pathname;
            if (pathName !== '/register' && pathName !== '/login') {
                navigate('/register', { replace: true, state: { fromProtectedRoute: true, attemptedPath: pathName } });
            }
        }
    }, [user, navigate]);

    return user ? <>{children}</> : null;
};

export default RequireAuth;
