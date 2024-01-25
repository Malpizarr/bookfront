import { Navigate, Route, useLocation } from 'react-router-dom';
import { useUser } from './UserContext';

const PrivateRoute = ({ element: Component, ...rest }) => {
    const { user } = useUser();
    const location = useLocation();

    return (
        <Route
            {...rest}
            element={user ? Component : <Navigate to="/login" state={{ from: location }} replace />}
        />
    );
};

export default PrivateRoute;