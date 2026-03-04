import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

type DesktopRightSectionProps = {
  supportLink: string;
  itemCount: number;
};

const DesktopRightSection = ({ supportLink, itemCount }: DesktopRightSectionProps) => {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Link
        to={supportLink}
        className="px-6 py-3 rounded-full whitespace-nowrap bg-gray-900 dark:bg-teal-500 hover:bg-gray-800 dark:hover:bg-teal-400 text-white text-xs font-semibold tracking-[0.12em] uppercase transition-colors shadow-[0_10px_22px_rgba(15,23,42,0.22)] dark:shadow-[0_10px_26px_rgba(20,184,166,0.3)]"
      >
        Contact Us
      </Link>

      <Link
        to="/cart"
        className="relative ml-2 h-10 w-10 inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/25 text-gray-700 dark:text-white/75 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <ShoppingCart className="w-4 h-4" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-teal-400 text-black text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Link>
    </div>
  );
};

export default DesktopRightSection;
