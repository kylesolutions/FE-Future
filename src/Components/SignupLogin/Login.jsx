import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';
import { updateUser } from '../../Redux/slices/userSlice';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(25, 'Username must be at most 25 characters')
        .required('Username is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, 'Password must include one uppercase letter, one lowercase letter, and one digit')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await axios.post('http://localhost:8000/login/', {
          username: values.username,
          password: values.password,
        });
        if (response.data.access) {
          localStorage.setItem('token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          console.log('Tokens stored:', { access: response.data.access, refresh: response.data.refresh });
          const userResponse = await axios.get('http://localhost:8000/user/', {
            headers: { Authorization: `Bearer ${response.data.access}` },
          });
          dispatch(updateUser({
            username: userResponse.data.username,
            name: userResponse.data.name || '',
            email: userResponse.data.email || '',
            phone: userResponse.data.phone || '',
            type: userResponse.data.is_staff ? 'admin' : 'user',
            id: userResponse.data.id || '',
            is_blocked: userResponse.data.is_blocked || false,
          }));
          navigate('/');
        } else {
          formik.setStatus('Invalid login response');
        }
      } catch (error) {
        console.error('Error during login:', error.response?.data || error.message);
        formik.setStatus(error.response?.data?.detail || 'Invalid username or password');
      }
    },
  });

  return (
    <div className="login-form">
      <h2>LOGIN</h2>
      <div>
        <label>Username</label>
        <input
          className="input"
          type="text"
          name="username"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.username}
        />
        {formik.touched.username && formik.errors.username && <p className="error">{formik.errors.username}</p>}
      </div>
      <div>
        <label>Password</label>
        <input
          className="input"
          type="password"
          name="password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
        />
        {formik.touched.password && formik.errors.password && <p className="error">{formik.errors.password}</p>}
      </div>
      <div className="login">
        <button type="button" onClick={formik.handleSubmit} disabled={formik.isSubmitting}>
          {formik.isSubmitting ? 'Logging in...' : 'LOGIN'}
        </button>
      </div>
      {formik.status && <p className="error">{formik.status}</p>}
    </div>
  );
}

export default Login;