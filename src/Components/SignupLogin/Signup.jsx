import axios from 'axios';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

function Signup() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { username: '', password1: '', password2: '', name: '', email: '', phone: '' },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(25, 'Username must be at most 25 characters')
        .required('Username is required'),
      password1: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, 'Password must include one uppercase letter, one lowercase letter, and one digit')
        .required('Password is required'),
      password2: Yup.string()
        .oneOf([Yup.ref('password1')], 'Passwords must match')
        .required('Confirm Password is required'),
      name: Yup.string()
        .required('Name is required'),
      email: Yup.string()
        .matches(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email format')
        .required('Email is required'),
      phone: Yup.string()
        .required('Phone is required'),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      Object.keys(values).forEach(key => formData.append(key, values[key]));
      try {
        const res = await axios.post('http://143.110.178.225/api/user_registration/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.result) {
          navigate('/'); // Redirect to login after successful signup
        } else {
          formik.setErrors(res.data.errors || { submit: 'Registration failed due to invalid data.' });
        }
      } catch (err) {
        console.error('Signup error:', err.response?.data || err.message);
        formik.setErrors({ submit: 'Registration failed. Please try again.' });
      }
    },
  });

  return (
    <div className="signup-form">
      <h2>Signup</h2>
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
          name="password1"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password1}
        />
        {formik.touched.password1 && formik.errors.password1 && <p className="error">{formik.errors.password1}</p>}
      </div>
      <div>
        <label>Confirm Password</label>
        <input
          className="input"
          type="password"
          name="password2"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password2}
        />
        {formik.touched.password2 && formik.errors.password2 && <p className="error">{formik.errors.password2}</p>}
      </div>
      <div>
        <label>Name</label>
        <input
          className="input"
          type="text"
          name="name"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.name}
        />
        {formik.touched.name && formik.errors.name && <p className="error">{formik.errors.name}</p>}
      </div>
      <div>
        <label>Email</label>
        <input
          className="input"
          type="email"
          name="email"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.email}
        />
        {formik.touched.email && formik.errors.email && <p className="error">{formik.errors.email}</p>}
      </div>
      <div>
        <label>Phone</label>
        <input
          className="input"
          type="text"
          name="phone"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.phone}
        />
        {formik.touched.phone && formik.errors.phone && <p className="error">{formik.errors.phone}</p>}
      </div>
      {formik.errors.submit && <p className="error">{formik.errors.submit}</p>}
      <button type="button" onClick={formik.handleSubmit} disabled={formik.isSubmitting}>
        {formik.isSubmitting ? 'Signing up...' : 'Signup'}
      </button>
    </div>
  );
}

export default Signup;