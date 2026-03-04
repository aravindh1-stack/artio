import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { homeContent } from './content';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-black dark:to-black text-gray-900 dark:text-white">
      <div className="absolute left-1/2 top-20 -translate-x-1/2 h-52 w-52 rounded-full bg-amber-400/12 dark:bg-amber-300/15 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(245,158,11,0.10),rgba(255,255,255,0)_45%)] dark:bg-[radial-gradient(circle_at_75%_20%,rgba(245,158,11,0.12),rgba(0,0,0,0)_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.07),rgba(255,255,255,0)_40%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.08),rgba(0,0,0,0)_40%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 dark:border-amber-500/30 bg-white/80 dark:bg-white/[0.03] text-[11px] tracking-[0.3em] uppercase text-slate-600 dark:text-amber-100/90 shadow-sm">
            {homeContent.eyebrow}
          </div>

          <h1 className="mt-8 text-5xl sm:text-6xl lg:text-[5.2rem] font-semibold leading-[0.98] text-gray-900 dark:text-white">
            {homeContent.titleLineOne}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 dark:from-amber-200 dark:via-amber-300 dark:to-amber-500">
              {homeContent.titleAccent}
            </span>
          </h1>

          <p className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            {homeContent.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/store"
              className="inline-flex items-center justify-center rounded-full px-8 py-3.5 border border-slate-800 dark:border-amber-300/40 bg-slate-900 dark:bg-transparent text-white dark:text-amber-200 text-xs font-semibold tracking-[0.14em] uppercase hover:bg-slate-700 dark:hover:bg-amber-300 dark:hover:text-black transition-colors"
            >
              Explore Collection
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full px-8 py-3.5 border border-slate-300 dark:border-white/20 bg-white/70 dark:bg-transparent text-gray-700 dark:text-white/90 text-xs font-semibold tracking-[0.14em] uppercase hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Start Conversation
            </Link>
          </div>

          <motion.div
            className="mt-12 inline-flex items-center gap-3 px-5 py-3 rounded-full border border-slate-300 dark:border-amber-500/25 bg-white/80 dark:bg-white/[0.03] shadow-sm"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700 dark:bg-amber-300" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-slate-600 dark:text-amber-100/90">Premium Visual Identities</span>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {[
              ['250+', 'Projects Shipped'],
              ['60+', 'Brand Partners'],
              ['98%', 'Client Satisfaction'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 dark:border-amber-200/15 bg-white/90 dark:bg-white/[0.03] shadow-sm px-5 py-4"
              >
                <p className="text-2xl font-semibold text-slate-900 dark:text-amber-200">{value}</p>
                <p className="mt-1 text-[10px] tracking-[0.2em] uppercase text-slate-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
