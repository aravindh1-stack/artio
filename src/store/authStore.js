import { create } from 'zustand';


export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  profile: null,
  role: 'user',

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile, role: profile?.role ?? 'user' }),

  fetchProfile: async (user) => {
    if (!user) {
      set({ profile: null, role: 'user' });
      return;
    }

    try {
      const params = new URLSearchParams();
      if (user.id) {
        params.set('userId', user.id);
      }
      if (user.email) {
        params.set('email', user.email);
      }

      const response = await fetch(`/api/profile/get?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Profile fetch failed');
      }

      const profile = await response.json();
      set({ profile, role: profile?.role ?? 'user' });
    } catch {
      set({ profile: { id: user.id, email: user.email, full_name: '', phone: '', role: 'user' }, role: 'user' });
    }
  },

  initialize: async () => {
    set({ loading: true });
    const storedUserRaw = localStorage.getItem('artio-auth-user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    set({ session: storedUser ? {} : null, user: storedUser });
    await get().fetchProfile(storedUser);
    set({ loading: false });
  },

  signOut: async () => {
    // TODO: Replace with Neon/pg sign out logic
    localStorage.removeItem('artio-auth-user');
    set({ user: null, session: null, profile: null, role: 'user' });
  },
}));
