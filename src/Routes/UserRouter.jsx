import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DesignPage from '../Pages/DesignPage';
import SignupPage from '../Pages/SignupPage';
import LoginPage from '../Pages/LoginPage';
import ProfilePage from '../Pages/ProfilePage';
import AdminPage from '../Pages/AdminPage';
import DetailsPage from '../Pages/DetailsPage';
import CartPage from '../Pages/CartPage';
import FirstTabPage from '../Pages/FirstTabPage';
import SaveOrderPage from '../Pages/SaveOrderPage';
import OrdersViewPage from '../Pages/OrdersViewPage';
import PaymentPage from '../Pages/PaymentPage';
import GiftPrintingPage from '../Pages/GiftPrintingPage';

import GiftOrderViewPage from '../Pages/GiftOrderViewPage';
import DocumentOrderViewPage from '../Pages/DocumentOrderViewPage';
import DocPrintPage from '../Pages/DocPrintPage';

function ProtectedAdminRoute({ children }) {
  const user = useSelector(state => state.user);
  return user.type === 'admin' ? children : <Navigate to="/login"/>;
}

function UserRouter() {
  return (
    <Routes>
      <Route path='/' element={<FirstTabPage/>}/>
      <Route path="design" element={<DesignPage activeCategory="frame" onCategorySelect={() => {}}/>} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="login" element={<LoginPage/>} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path='cart' element={<CartPage/>}/>
      <Route path='savedorder' element={<SaveOrderPage/>}/>
      <Route path="/admin/create-frame" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>}/>
      <Route path="/details" element={<ProtectedAdminRoute><DetailsPage /></ProtectedAdminRoute>}/>
      <Route path='ordersview' element={<OrdersViewPage/>}/>
      <Route path='payment' element={<PaymentPage/>}/>
      <Route path='gifting' element={<GiftPrintingPage/>}/>
      <Route path='document' element={<DocPrintPage/>}/>
      <Route path='giftorder' element={<GiftOrderViewPage/>}/>
      <Route path='documentorder' element={<DocumentOrderViewPage/>}/>
    </Routes>
  );
}

export default UserRouter;