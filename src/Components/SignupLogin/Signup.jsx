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
    initialValues: {
      username: '',
      password1: '',
      password2: '',
      email: '',
      name: '',
      phone: '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(25, 'Username must be at most 25 characters')
        .required('Username is required'),
      password1: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
          'Password must include one uppercase letter, one lowercase letter, and one digit'
        )
        .required('Password is required'),
      password2: Yup.string()
        .oneOf([Yup.ref('password1'), null], 'Passwords must match')
        .required('Confirm Password is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      name: Yup.string()
        .max(100, 'Name must be at most 100 characters')
        .optional(),
      phone: Yup.string()
        .matches(/^\d{10}$/, 'Phone number must be 10 digits')
        .optional(),
    }),
    onSubmit: async (values, { setStatus, setErrors }) => {
      try {
        const response = await axios.post('http://82.180.146.4:8001/api/user_registration/', {
          username: values.username,
          password1: values.password1, // Send password1
          password2: values.password2, // Send password2
          email: values.email,
          name: values.name || null,
          phone: values.phone || null,
        });
        console.log('Signup response:', response.data);
        if (response.data.result && response.data.access) {
          localStorage.setItem('token', response.data.access); // Fixed typo
          localStorage.setItem('refresh_token', response.data.refresh);
          const userResponse = await axios.get('http://82.180.146.4:8001/user/', {
            headers: { Authorization: `Bearer ${response.data.access}` },
          });
          console.log('User response:', userResponse.data);
          dispatch(
            updateUser({
              username: userResponse.data.username,
              name: userResponse.data.name || '',
              email: userResponse.data.email || '',
              phone: userResponse.data.phone || '',
              type: userResponse.data.is_staff ? 'admin' : 'user',
              id: userResponse.data.id || '',
              is_blocked: userResponse.data.is_blocked || false,
            })
          );
          navigate('/');
        } else {
          setStatus('Invalid signup response');
        }
      } catch (error) {
        console.error('Error during signup:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors); // Map all server-side errors
        } else {
          setStatus(
            error.response?.data?.detail ||
              JSON.stringify(error.response?.data) ||
              'Signup failed. Please try again.'
          );
        }
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
          <label className="form-label">Name</label>
          <input
            className="form-control"
            type="text"
            name="name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.name}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="error">{formik.errors.name}</p>
          )}
        </div>
        <div className="w-100 mt-3">
          <label className="form-label">Phone</label>
          <input
            className="form-control"
            type="text"
            name="phone"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.phone}
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="error">{formik.errors.phone}</p>
          )}
        </div>
        <div className="w-100 mt-3">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            name="password1"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.password1}
          />
          {formik.touched.password1 && formik.errors.password1 && (
            <p className="error">{formik.errors.password1}</p>
          )}
        </div>
        <div className="w-100 mt-3">
          <label className="form-label">Confirm Password</label>
          <input
            className="form-control"
            type="password"
            name="password2"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onKeyPress={handleKeyPress}
            value={formik.values.password2}
          />
          {formik.touched.password2 && formik.errors.password2 && (
            <p className="error">{formik.errors.password2}</p>
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