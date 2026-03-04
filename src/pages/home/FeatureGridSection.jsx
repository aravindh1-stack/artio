import { motion } from 'framer-motion';
import { homeFeatures } from './content';

const FeatureGridSection = () => {
  return (
    <section className="bg-white dark:bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-[0.28em] uppercase text-slate-500 dark:text-amber-200/80">Core Strengths</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">Built for Distinction</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {homeFeatures.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-slate-200 dark:border-amber-200/15 bg-white dark:bg-white/[0.03] shadow-sm p-7 sm:p-8"
            >
              <div className="h-1 w-14 rounded-full bg-slate-800 dark:bg-amber-300/70 mb-5" />
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-amber-100">{item.title}</h3>
              <p className="mt-4 text-slate-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGridSection;
