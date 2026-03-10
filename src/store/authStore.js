import { create } from 'zustand';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { getProfileByUser } from '../lib/firestoreDb';


export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  profile: null,
  role: 'user',
  unsubscribeAuth: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => {
    const normalizedRole = String(profile?.role ?? 'user').trim().toLowerCase() || 'user';
    set({ profile, role: normalizedRole });
  },

  fetchProfile: async (user) => {
    if (!user) {
      set({ profile: null, role: 'user' });
      return;
    }

    try {
      const profile = await getProfileByUser({ userId: user.id, email: user.email });
      if (!profile) {
        throw new Error('Profile fetch failed');
      }
      const normalizedRole = String(profile?.role ?? 'user').trim().toLowerCase() || 'user';
      set({ profile, role: normalizedRole });
    } catch {
      set({ profile: { id: user.id, email: user.email, full_name: '', phone: '', role: 'user' }, role: 'user' });
    }
  },

  initialize: async () => {
    set({ loading: true });

    if (!isFirebaseConfigured || !firebaseAuth) {
      set({ loading: false, user: null, session: null, profile: null, role: 'user' });
      return;
    }

    const existingUnsubscribe = get().unsubscribeAuth;
    if (typeof existingUnsubscribe === 'function') {
      existingUnsubscribe();
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, session: null, profile: null, role: 'user', loading: false });
        return;
      }

      const nextUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || '',
      };

      set({ user: nextUser, session: { uid: firebaseUser.uid }, loading: false });
      await get().fetchProfile(nextUser);
    });

    set({ unsubscribeAuth: unsubscribe, loading: false });
  },

  signOut: async () => {
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    set({ user: null, session: null, profile: null, role: 'user' });
  },
}));
