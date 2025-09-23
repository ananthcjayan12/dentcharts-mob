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
      <div className="min-h-screen bg-gradient-to-b from-primary-300 to-primary-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="absolute top-20 -left-16 w-128 h-80" viewBox="0 0 500 300" fill="none">
            <path d="M0 150C50 50 150 50 250 150C350 250 450 250 500 150V300H0V150Z" fill="rgba(255,255,255,0.1)" />
          </svg>
        </div>

        <div className="relative z-10 px-6 pt-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-sm font-bold text-black mb-2 font-montserrat">
              Welcome
            </h1>
            <h2 className="text-4xl font-bold text-black font-montserrat">
              Doctor
            </h2>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-t-3xl px-6 pt-8 pb-12 mt-8">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 font-montserrat leading-relaxed">
                Please login with your login ID or Phone Number. If you don't have any login id, please{' '}
                <span className="text-primary-500 font-bold">Register Now!</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="text-red-500 text-sm text-center">{errors.general}</div>
              )}

              <InputField
                label="Login ID or Phone Number"
                name="email"
                type="email"
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
