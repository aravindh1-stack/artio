import { Link } from 'react-router-dom';

type NavItem = {
  name: string;
  href: string;
};

type DesktopNavSectionProps = {
  navigation: NavItem[];
  isActive: (path: string) => boolean;
};

const DesktopNavSection = ({ navigation, isActive }: DesktopNavSectionProps) => {
  return (
    <div className="hidden md:flex items-center justify-center flex-1 min-w-0">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 dark:border-white/15 bg-white/85 dark:bg-black/35 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] max-w-full overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`px-4 py-2.5 rounded-full whitespace-nowrap no-underline text-[11px] font-semibold tracking-[0.14em] uppercase transition-all duration-200 ${
              isActive(item.href)
                ? 'bg-black/10 dark:bg-white/14 text-gray-900 dark:text-white shadow-[inset_0_0_0_1px_rgba(17,24,39,0.12)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                : 'text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/8'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DesktopNavSection;
