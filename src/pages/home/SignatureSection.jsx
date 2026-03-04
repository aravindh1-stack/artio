import { motion } from 'framer-motion';
import { homeStats } from './content';

const SignatureSection = () => {
  return (
    <section className="bg-white dark:bg-black py-24 border-y border-slate-200 dark:border-amber-200/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start"
        >
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase text-slate-500 dark:text-amber-200/80">Signature Process</p>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 dark:text-white leading-tight">
              Crafted for brands that value detail, depth, and distinction.
            </h2>
            <p className="mt-6 text-slate-600 dark:text-gray-300 text-lg leading-relaxed max-w-xl">
              From concept to execution, every step is designed to preserve premium aesthetics and clear visual communication.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {homeStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-amber-200/15 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.05] dark:to-white/[0.02] shadow-sm p-6">
                <p className="text-4xl sm:text-5xl font-semibold text-slate-900 dark:text-amber-200">{stat.value}</p>
                <p className="mt-2 text-xs tracking-[0.2em] uppercase text-slate-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SignatureSection;
