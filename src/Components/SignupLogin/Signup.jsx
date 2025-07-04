import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';
import { updateUser } from '../../Redux/slices/userSlice';

function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: { username: '', password: '', email: '' },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(25, 'Username must be at most 25 characters')
        .required('Username is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, 'Password must include one uppercase letter, one lowercase letter, and one digit')
        .required('Password is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await axios.post('http://143.110.178.225/signup/', {
          username: values.username,
          password: values.password,
          email: values.email,
        });
        if (response.data.access) {
          localStorage.setItem('token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          const userResponse = await axios.get('http://143.110.178.225/user/', {
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
          formik.setStatus('Invalid signup response');
        }
      } catch (error) {
        console.error('Error during signup:', error.response?.data || error.message);
        formik.setStatus(error.response?.data?.detail || 'Signup failed');
      }
    },
  });

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  return (
    <div className="signup-wrapper-1">
      <style>{`
        .signup-wrapper {
          display: flex;
          flex-direction: column;
          border: 1px solid #6c757d;
          border-radius: 10px;
          width: 100%;
          max-width: 350px;
          padding: 20px;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(#313030, #9c9696);
          transition: box-shadow 0.3s ease;
        }
        .signup-wrapper:hover {
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(245, 245, 245, 0.5);
        }
        .signup-wrapper-1 {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding-top: 10px;
          background: #f8f9fa;
        }
        .signup-wrapper-1 p {
          color: #ffffff;
        }
        .signup {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .form-label {
          color: #ffffff;
          font-weight: 500;
        }
        .form-control {
          background-color: #495057;
          color: #ffffff;
          border-color: #6c757d;
        }
        .form-control:focus {
          background-color: #495057;
          color: #ffffff;
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        .error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        .btn-primary {
          width: 100%;
          background-color: #007bff;
          border-color: #007bff;
        }
        .btn-primary:hover {
          background-color: #0056b3;
          border-color: #004085;
        }
        .btn-primary:disabled {
          background-color: #6c757d;
          border-color: #6c757d;
        }
        .login-link {
          color: #007bff;
          text-decoration: none;
        }
        .login-link:hover {
          text-decoration: underline;
        }
      `}</style>
      <div className="signup-wrapper">
        <h2 className="text-white text-center mb-4">SIGNUP</h2>
        <div className="w-100">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            type="text"
            name="username"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.username}
          />
          {formik.touched.username && formik.errors.username && (
            <p className="error">{formik.errors.username}</p>
          )}
        </div>
        <div className="w-100 mt-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            type="email"
            name="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.email}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="error">{formik.errors.email}</p>
          )}
        </div>
        <div className="w-100 mt-3">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            name="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.password}
          />
          {formik.touched.password && formik.errors.password && (
            <p className="error">{formik.errors.password}</p>
          )}
        </div>
        <div className="signup mt-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={formik.handleSubmit}
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Signing up...' : 'SIGNUP'}
          </button>
        </div>
        {formik.status && <p className="error text-center">{formik.status}</p>}
        <p className="mt-3 text-center">
          Already registered?{' '}
          <a
            href="/login"
            className="login-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;