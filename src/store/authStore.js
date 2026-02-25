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
    // TODO: Replace with Neon/pg query
    set({ profile: { id: user.id, email: user.email, full_name: '', phone: '', role: 'user' }, role: 'user' });
  },

  initialize: async () => {
    set({ loading: true });
    // TODO: Replace with Neon/pg auth logic
    set({ session: null, user: null });
    await get().fetchProfile(null);
    set({ loading: false });
  },

  signOut: async () => {
    // TODO: Replace with Neon/pg sign out logic
    set({ user: null, session: null, profile: null, role: 'user' });
  },
}));
