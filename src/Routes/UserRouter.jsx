import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DesignPage from '../Pages/DesignPage';
import SignupPage from '../Pages/SignupPage';
import LoginPage from '../Pages/LoginPage';
import ProfilePage from '../Pages/ProfilePage';
import AdminPage from '../Pages/AdminPage';
import DetailsPage from '../Pages/DetailsPage';
import CartPage from '../Pages/CartPage';

function ProtectedAdminRoute({ children }) {
  const user = useSelector(state => state.user);
  return user.type === 'admin' ? children : <Navigate to="/login" />;
}

function UserRouter() {
  return (
    <Routes>
      <Route path="/" element={<DesignPage activeCategory="frame" onCategorySelect={() => {}}/>} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="login" element={<LoginPage/>} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path='cart' element={<CartPage/>}/>
      <Route
        path="/admin/create-frame"
        element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>}
      />
      <Route
        path="/details"
        element={<ProtectedAdminRoute><DetailsPage /></ProtectedAdminRoute>}
      />
    </Routes>
  );
}

export default UserRouter;