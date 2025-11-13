import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Stack, Card, Typography, InputField, Button, Divider } from '../components';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
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
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register(formData);
      navigate('/home');
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden flex items-center justify-center py-6 sm:py-12">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 -right-10 w-48 h-48 sm:w-72 sm:h-72 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute bottom-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Container size="sm" className="relative z-10">
        <Stack direction="vertical" spacing={6}>
          {/* Header */}
          <Stack direction="vertical" spacing={3} align="center" className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <span className="text-3xl sm:text-4xl">👨‍⚕️</span>
            </div>
            <div>
              <Typography variant="body1" className="text-white/90 mb-1 sm:mb-2 text-sm sm:text-base">
                Welcome
              </Typography>
              <Typography variant="h2" weight="bold" className="text-white text-2xl sm:text-3xl">
                Doctor
              </Typography>
            </div>
          </Stack>

          {/* Register Form Card */}
          <Card variant="default" padding="lg" className="bg-white/95 backdrop-blur-md shadow-2xl">
            <Stack direction="vertical" spacing={6}>
              {/* Form Header */}
              <Stack direction="vertical" spacing={2} align="center">
                <Typography variant="h4" weight="bold" className="text-gray-900">
                  Create Account
                </Typography>
                <Typography variant="body2" color="secondary" align="center" className="max-w-md px-2">
                  Please Sign Up with your <strong>Phone Number</strong> and BMDC licence number
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
                    label="Mobile Number"
                    name="phone"
                    type="tel"
                    placeholder="8801xxxxxxxxx"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={errors.phone}
                    helperText="Enter your 11-digit mobile number"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    }
                    size="lg"
                  />

                  <InputField
                    label="Full Name"
                    name="name"
                    type="text"
                    placeholder="Dr. John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={errors.name}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    size="lg"
                  />

                  <InputField
                    label="Email Address (Optional)"
                    name="email"
                    type="email"
                    placeholder="doctor@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                    size="lg"
                  />

                  <InputField
                    label="Create Password"
                    name="password"
                    type="password"
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    helperText="Minimum 6 characters"
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
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  <Divider />

                  <div className="text-center">
                    <Typography variant="body2" color="secondary" className="mb-2">
                      Already have an account?
                    </Typography>
                    <Link to="/login">
                      <Button variant="outline" size="md" fullWidth>
                        Sign In Here
                      </Button>
                    </Link>
                  </div>
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

export default RegisterPage;
