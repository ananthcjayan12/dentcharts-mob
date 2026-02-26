import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MobileContainer from '../components/layout/MobileContainer';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      navigate('/home');
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
    }
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-primary-400 via-primary-500 to-green-400 relative overflow-hidden">
        {/* Animated background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/4 -left-20 w-60 h-60 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>

        <div className="relative z-10 px-6 pt-16 pb-8 flex flex-col min-h-screen">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white mb-2 font-lato">
              Welcome Back
            </h1>
            <h2 className="text-3xl font-bold text-white font-montserrat">
              Doctor
            </h2>
          </div>

          {/* Login Form */}
          <div className="flex-1 bg-white/95 backdrop-blur-md rounded-t-3xl px-6 pt-8 pb-8 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-montserrat">Sign In</h3>
              <p className="text-sm text-gray-600 font-lato leading-relaxed">
                Please login with your credentials. Don't have an account?{' '}
                <Link to="/register" className="text-primary-500 font-bold hover:text-primary-600">
                  Register Now!
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="text-red-500 text-sm text-center">{errors.general}</div>
              )}

              <InputField
                label="Login ID or Phone Number"
                name="email"
                type="text"
                data-testid="login-email"
                placeholder="id-xxxxxx / 8801xxxxxx"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                icon={<span className="text-gray-400">👤</span>}
              />

              <InputField
                label="Password"
                name="password"
                type="password"
                data-testid="login-password"
                placeholder="..........."
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                icon={<span className="text-gray-400">🔒</span>}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                data-testid="login-submit"
                className="w-full font-montserrat"
                isLoading={isLoading}
              >
                Login
              </Button>

              <div className="text-center space-y-2">
                <Link to="/forgot-password" className="text-sm text-gray-500">
                  Forgot password?
                </Link>
                <div>
                  <Link to="/register" className="text-sm text-primary-500 font-bold">
                    New here? Register Now
                  </Link>
                </div>
              </div>
            </form>

            {/* Logo */}
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-gray-600 font-bold text-sm">Medilife Solutions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default LoginPage;
