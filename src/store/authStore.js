import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role')
      .eq('id', user.id)
      .single();

    set({ profile: data ?? null, role: data?.role ?? 'user' });
  },

  initialize: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ session, user });
    await get().fetchProfile(user);
    set({ loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const nextUser = session?.user ?? null;
        set({ session, user: nextUser });
        await get().fetchProfile(nextUser);
      })();
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, role: 'user' });
  },
}));
