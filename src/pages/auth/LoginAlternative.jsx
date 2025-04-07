// src/pages/auth/LoginAlternative.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginAlternative = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Inline styles backup in case Tailwind doesn't work
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '1rem'
    },
    formContainer: {
      width: '100%',
      maxWidth: '28rem',
    },
    header: {
      textAlign: 'center',
      marginBottom: '1.5rem'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: '#2563eb',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827',
      marginTop: '1.5rem',
      marginBottom: '0.5rem'
    },
    description: {
      fontSize: '0.875rem',
      color: '#4b5563',
      marginTop: '0.5rem'
    },
    formBox: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    },
    errorBox: {
      marginBottom: '1rem',
      padding: '0.75rem',
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      borderRadius: '0.375rem',
      fontSize: '0.875rem'
    },
    form: {
      marginBottom: '1.5rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '0.875rem'
    },
    checkbox: {
      marginRight: '0.5rem'
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    buttonHover: {
      backgroundColor: '#1d4ed8'
    },
    forgotPassword: {
      fontSize: '0.875rem',
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '500'
    },
    divider: {
      position: 'relative',
      marginTop: '1.5rem',
      marginBottom: '1.5rem',
      height: '1px',
      backgroundColor: '#e5e7eb'
    },
    dividerText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '0 0.5rem',
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    signupText: {
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#4b5563'
    },
    signupLink: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '500'
    },
    flex: {
      display: 'flex'
    },
    justifyBetween: {
      justifyContent: 'space-between'
    },
    alignCenter: {
      alignItems: 'center'
    },
    spinner: {
      display: 'inline-block',
      width: '1.25rem',
      height: '1.25rem',
      marginRight: '0.5rem',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTop: '2px solid white',
      animation: 'spin 1s linear infinite'
    }
  };

  return (
    <div style={styles.container} className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div style={styles.formContainer} className="w-full max-w-md">
        <div style={styles.header} className="text-center mb-6">
          <h1 style={styles.title} className="text-3xl font-bold text-blue-600">Church Connect</h1>
          <h2 style={styles.subtitle} className="mt-6 text-2xl font-bold text-gray-900">Welcome back</h2>
          <p style={styles.description} className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <div style={styles.formBox} className="bg-white p-8 shadow rounded-lg">
          {error && (
            <div style={styles.errorBox} className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form style={styles.form} className="space-y-6" onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                style={styles.input}
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                style={styles.input}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div style={{...styles.flex, ...styles.justifyBetween, ...styles.alignCenter}} className="flex items-center justify-between">
              <div style={styles.flex} className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={styles.checkbox}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <div>
                <Link to="/forgot-password" style={styles.forgotPassword} className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                style={styles.button}
                className="btn btn-primary w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-sm font-medium"
              >
                {loading ? (
                  <div style={styles.spinner} className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full" />
                ) : null}
                Sign in
              </button>
            </div>
          </form>
          
          <div>
            <div style={styles.divider}>
              <div style={styles.dividerText}>Or</div>
            </div>
            
            <div style={styles.signupText} className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" style={styles.signupLink} className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAlternative;
