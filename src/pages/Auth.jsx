import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

import artioLightLogo from '../assets/artio-light-logo.png';
import artioDarkLogo from '../assets/artio-dark-logo.png';
import emailjs from 'emailjs-com';
import { useAuthStore } from '../store/authStore';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const mode = searchParams.get('mode');
    setIsLogin(mode !== 'signup');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (isLogin) {
        // TODO: Replace with Neon/pg login logic
        setUser({ email: formData.email });
        setSession({});
        navigate('/');
      } else {
        if (!formData.fullName.trim()) {
          throw new Error('Full name is required');
        }

        if (!formData.phone.trim()) {
          throw new Error('Phone number is required');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Neon signup logic (placeholder)
        // Generate a verification token
        const verificationToken = Math.random().toString(36).substr(2, 16);
        // Save user and token to Neon (replace with your Neon REST API call)
        // await fetch('YOUR_NEON_SIGNUP_ENDPOINT', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     fullName: formData.fullName,
        //     phone: formData.phone,
        //     email: formData.email,
        //     password: formData.password,
        //     verificationToken,
        //   }),
        // });

        // Send verification email using EmailJS
        const verificationLink = `${window.location.origin}/verify?token=${verificationToken}`;
        const templateParams = {
          email: formData.email,
          full_name: formData.fullName,
          verification_link: verificationLink,
        };
        await emailjs.send(
          'service_ypdqd7b', // Your Service ID
          'template_whb74ht', // Your actual Template ID
          templateParams,
          'YOUR_PUBLIC_KEY'   // Replace with your Public Key
        );

        setInfo('Signup successful! Please check your email to verify your account.');
        setError('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '') : value;
    setFormData({
      ...formData,
      [name]: nextValue,
    });
  };

  return (
    // ...existing code...
    <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      <div className="w-full max-w-md px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8 flex flex-col items-center">
            <span className="relative w-16 h-16 mb-2">
              <img
                src={window.matchMedia('(prefers-color-scheme: dark)').matches ? artioDarkLogo : artioLightLogo}
                alt="Artio Logo"
                className="w-16 h-16 object-contain mx-auto"
              />
            </span>
            <h1 className="text-4xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin
                ? 'Sign in to access your account'
                : 'Join Artio Redefined today'}
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {info && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">{info}</p>
                </div>
              )}

              <div className="space-y-4">
                {!isLogin && (
                  <>
                    <Input
                      type="text"
                      name="fullName"
                      placeholder="Full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-12"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-12"
                  />
                </div>

                {!isLogin && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="pl-12"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    <UserIcon className="w-5 h-5" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  const nextIsLogin = !isLogin;
                  const nextParams = new URLSearchParams(searchParams);
                  if (nextIsLogin) {
                    nextParams.delete('mode');
                  } else {
                    nextParams.set('mode', 'signup');
                  }
                  setSearchParams(nextParams);
                  setError('');
                  setInfo('');
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
