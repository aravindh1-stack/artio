export const getNavigation = (role) => [
  { name: 'Home', href: '/' },
  { name: 'Store', href: '/store' },
  { name: "Founder's Portfolio", href: '/founders-portfolio' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Contact', href: '/contact' },
  ...(role === 'admin' ? [{ name: 'Admin', href: '/admin' }] : []),
];

export const supportLink = '/contact';
