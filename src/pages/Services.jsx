import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Palette, FileText, Globe, Package, ArrowRight, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Services = () => {
  const services = [
    {
      icon: Palette,
      title: 'Visual Identity Design',
      description: 'Complete brand identity systems that define who you are',
      features: [
        'Logo design and brand marks',
        'Color palette development',
        'Typography selection',
        'Brand guidelines',
      ],
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      icon: FileText,
      title: 'Print Design',
      description: 'Premium print materials that make lasting impressions',
      features: [
        'Business cards and stationery',
        'Brochures and catalogs',
        'Packaging design',
        'Posters and banners',
      ],
      image: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      icon: Globe,
      title: 'Digital Assets',
      description: 'Stunning digital designs for modern platforms',
      features: [
        'Social media graphics',
        'Website design',
        'Email templates',
        'Digital advertisements',
      ],
      image: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      icon: Package,
      title: 'Custom Commissions',
      description: 'Bespoke artwork created specifically for your vision',
      features: [
        'Custom illustrations',
        'Photography direction',
        'Art consulting',
        'Installation planning',
      ],
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
  ];

  const process = [
    {
      step: '01',
      title: 'Discovery',
      description: 'We start by understanding your vision, goals, and target audience.',
    },
    {
      step: '02',
      title: 'Strategy',
      description: 'Develop a comprehensive design strategy aligned with your objectives.',
    },
    {
      step: '03',
      title: 'Creation',
      description: 'Our team brings your vision to life with meticulous attention to detail.',
    },
    {
      step: '04',
      title: 'Refinement',
      description: 'Iterate and perfect until every element exceeds expectations.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen pt-16">
      <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-gradient">
              Design Services
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              From concept to execution, we craft visual identities and design solutions that resonate, inspire, and endure.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What We Offer</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Comprehensive design solutions for every need
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-24"
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                    <service.icon className="w-8 h-8 text-gray-900 dark:text-gray-100" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{service.title}</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-3">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-gray-900 dark:text-gray-100 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <Card className="overflow-hidden">
                    <div className="relative h-[400px]">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Card>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Process</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              A proven approach to exceptional design
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {process.map((step, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 h-full">
                  <div className="text-5xl font-bold text-gray-200 dark:text-gray-800 mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold mb-6">Why Choose Artio?</h2>
              <div className="space-y-4 text-lg text-gray-600 dark:text-gray-400">
                <p>
                  We're not just designers - we're strategic partners invested in your success. Every project receives our full attention and expertise.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-black dark:text-white mt-0.5 flex-shrink-0" />
                    <span>Decade of experience in brand and identity design</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-black dark:text-white mt-0.5 flex-shrink-0" />
                    <span>Collaborative approach with transparent communication</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-black dark:text-white mt-0.5 flex-shrink-0" />
                    <span>Unlimited revisions until you're completely satisfied</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-black dark:text-white mt-0.5 flex-shrink-0" />
                    <span>Comprehensive deliverables and ongoing support</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[500px] rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Design team"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">Ready to Start Your Project?</h2>
            <p className="text-xl text-gray-300">
              Let's discuss how we can bring your vision to life with exceptional design
            </p>
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="mt-4">
                Get in Touch
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;
