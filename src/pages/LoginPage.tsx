import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Stack, Card, Typography, InputField, Button, Divider } from '../components';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  // Get the intended destination from ProtectedRoute's redirect state
  const from = (location.state as any)?.from?.pathname || '/home';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrors({ general: error?.message || 'Login failed. Please check your credentials.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden flex items-center justify-center">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 sm:w-60 sm:h-60 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute top-1/4 -left-20 w-60 h-60 sm:w-80 sm:h-80 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-10 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <Container size="sm" className="relative z-10 py-6 sm:py-12">
        <Stack direction="vertical" spacing={6} className="sm:spacing-8">
          {/* Header */}
          <Stack direction="vertical" spacing={3} align="center" className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <span className="text-3xl sm:text-4xl">🦷</span>
            </div>
            <div>
              <Typography variant="body1" className="text-white/90 mb-1 sm:mb-2 text-sm sm:text-base">
                Welcome Back
              </Typography>
              <Typography variant="h2" weight="bold" className="text-white text-2xl sm:text-3xl">
                Doctor
              </Typography>
            </div>
          </Stack>

          {/* Login Form Card */}
          <Card variant="default" padding="lg" className="bg-white/95 backdrop-blur-md shadow-2xl">
            <Stack direction="vertical" spacing={6}>
              {/* Form Header */}
              <Stack direction="vertical" spacing={2} align="center">
                <Typography variant="h4" weight="bold" className="text-gray-900">
                  Sign In
                </Typography>
                <Typography variant="body2" color="secondary" align="center" className="max-w-sm">
                  Please login with your credentials. Don't have an account?{' '}
                  <Link to="/register" className="text-primary-500 font-semibold hover:text-primary-600 hover:underline">
                    Register Now!
                  </Link>
                </Typography>
              </Stack>

              <Divider />

              <form onSubmit={handleSubmit}>
                <Stack direction="vertical" spacing={4}>
                  {errors.general && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                      {errors.general}
                    </div>
                  )}

                  <InputField
                    label="Login ID or Phone Number"
                    name="email"
                    type="text"
                    placeholder="id-xxxxxx / 8801xxxxxx"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    size="lg"
                  />

                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    size="lg"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>

                  <div className="text-center">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-gray-600 hover:text-primary-500 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Divider label="OR" />

                  <Link to="/register">
                    <Button variant="outline" size="lg" fullWidth>
                      Create New Account
                    </Button>
                  </Link>
                </Stack>
              </form>
            </Stack>
          </Card>

          {/* Footer Logo */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3 bg-white/15 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white/30">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="text-primary-600 font-bold text-sm sm:text-base">D</span>
              </div>
              <Typography variant="body2" weight="medium" className="text-white text-sm sm:text-base">
                DentCharts Mobile
              </Typography>
            </div>
          </div>
        </Stack>
      </Container>
    </div>
  );
};

export default LoginPage;
