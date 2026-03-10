import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import emailjs from 'emailjs-com';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { upsertProfile } from '../lib/firestoreDb';

const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const isEmailJsConfigured = Boolean(emailJsServiceId && emailJsTemplateId && emailJsPublicKey);

const mapAuthErrorMessage = (err) => {
  const code = String(err?.code || '').trim();

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is not configured yet. In Firebase Console, enable Authentication and Email/Password sign-in.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is disabled in Firebase. Enable it in Authentication -> Sign-in method.';
  }

  if (code === 'auth/invalid-api-key') {
    return 'Invalid Firebase API key. Check VITE_FIREBASE_API_KEY in .env.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Auth. Add localhost to Authentication -> Settings -> Authorized domains.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please sign in instead.';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid email or password. Please check and try again.';
  }

  if (code === 'auth/user-not-found') {
    return 'No account found for this email. Please create an account first.';
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }

  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network issue detected. Please check your internet and try again.';
  }

  if (code === 'auth/missing-password') {
    return 'Password is required.';
  }

  return 'Authentication failed. Please try again.';
};

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
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const { isDark } = useThemeStore();

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
      if (!isFirebaseConfigured || !firebaseAuth) {
        throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys in .env.');
      }

      if (isLogin) {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          formData.email,
          formData.password
        );
        const firebaseUser = credential.user;
        const nextUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: firebaseUser.displayName || '',
        };

        await upsertProfile({
          userId: firebaseUser.uid,
          email: formData.email,
          fullName: firebaseUser.displayName || '',
          phone: '',
        });

        setUser(nextUser);
        setSession({ uid: firebaseUser.uid });
        await fetchProfile(nextUser);
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

        const verificationToken = Math.random().toString(36).substr(2, 16);

        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          formData.email,
          formData.password
        );
        const firebaseUser = credential.user;

        await updateProfile(firebaseUser, {
          displayName: formData.fullName.trim(),
        });

        if (isEmailJsConfigured) {
          const verificationLink = `${window.location.origin}/verify?token=${verificationToken}`;
          const templateParams = {
            email: formData.email,
            full_name: formData.fullName,
            verification_link: verificationLink,
          };

          try {
            await emailjs.send(
              emailJsServiceId,
              emailJsTemplateId,
              templateParams,
              emailJsPublicKey
            );
          } catch (emailError) {
            console.warn('EmailJS send failed:', emailError);
            setInfo('Account created successfully, but verification email could not be sent right now.');
          }
        }

        await upsertProfile({
          userId: firebaseUser.uid,
          email: formData.email,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
        });

        const nextUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: formData.fullName.trim(),
        };
        setUser(nextUser);
        setSession({ uid: firebaseUser.uid });
        await fetchProfile(nextUser);
        navigate('/');

        if (isEmailJsConfigured) {
          setInfo('Signup successful! Please check your email to verify your account.');
        } else {
          setInfo('Signup successful! Configure EmailJS keys to enable verification emails.');
        }
        setError('');
      }
    } catch (err) {
      setError(mapAuthErrorMessage(err));
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
    <div className="min-h-screen pt-28 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      <div className="w-full max-w-md px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8 flex flex-col items-center">
            <span className="relative w-16 h-16 mb-2">
              <img
                src={isDark ? '/artio-dark-theme.png' : '/artio-light-theme.png'}
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
                : 'Join Artio today'}
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
