const ADMIN_EMAILS = ['officialartio375@gmail.com', 'aravindhofficiallinks@gmail.com'];

const isAdminRole = (role, user) => {
  const normalized = String(role ?? '').trim().toLowerCase();
  const email = String(user?.email ?? '').trim().toLowerCase();
  const byRole = normalized === 'admin' || normalized === 'super_admin' || normalized === 'superadmin';
  const byEmail = ADMIN_EMAILS.includes(email);
  return byRole || byEmail;
};

export const getNavigation = (role, user) => [
  { name: 'Home', href: '/' },
  { name: 'Store', href: '/store' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Contact', href: '/contact' },
  ...(isAdminRole(role, user) ? [{ name: 'Admin', href: '/admin' }] : []),
];

export const supportLink = '/contact';
