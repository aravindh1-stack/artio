import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CtaSection = () => {
  return (
    <section className="bg-white dark:bg-black py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-slate-200 dark:border-amber-200/20 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.06] dark:to-white/[0.02] shadow-sm p-10 sm:p-14"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">Bring premium visual identity to your next project.</h2>
          <p className="mt-5 text-slate-600 dark:text-gray-300 text-lg leading-relaxed">
            Discover curated works or connect directly for a custom creative direction.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/store"
              className="inline-flex items-center justify-center rounded-full px-8 py-3.5 bg-slate-900 dark:bg-amber-400 text-white dark:text-black text-xs font-semibold tracking-[0.14em] uppercase hover:bg-slate-800 dark:hover:bg-amber-300 transition-colors"
            >
              Visit Store
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full px-8 py-3.5 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white text-xs font-semibold tracking-[0.14em] uppercase hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
