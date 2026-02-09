import { motion } from 'framer-motion';
import { Eye, Palette, Target, Users } from 'lucide-react';
import Card from '../components/ui/Card';

const About = () => {
  const values = [
    {
      icon: Eye,
      title: 'Vision',
      description: 'To redefine how premium art is experienced and collected in modern spaces.',
    },
    {
      icon: Palette,
      title: 'Craftsmanship',
      description: 'Every piece is produced with meticulous attention to detail and quality.',
    },
    {
      icon: Target,
      title: 'Purpose',
      description: 'Art that serves a purpose - elevating spaces and inspiring minds.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a community of discerning collectors and art enthusiasts.',
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
      <section className="relative py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-gradient">
              About Artio Redefined
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              We believe in the transformative power of exceptional design. Every piece in our collection is chosen to inspire, elevate, and bring meaning to the spaces we inhabit.
            </p>
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
              <h2 className="text-4xl font-bold mb-6">Design-First Philosophy</h2>
              <div className="space-y-4 text-lg text-gray-600 dark:text-gray-400">
                <p>
                  At Artio Redefined, we don't just sell art - we curate experiences. Our design-first approach means every piece is evaluated not just for its aesthetic merit, but for its ability to transform and enhance the environment it inhabits.
                </p>
                <p>
                  We work with talented artists and photographers from around the world, ensuring that each print meets our exacting standards for composition, color theory, and emotional impact.
                </p>
                <p>
                  Our commitment to quality extends beyond the artwork itself. We use only museum-grade archival paper and premium inks to ensure your investment will remain vibrant for generations to come.
                </p>
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
                src="https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Design studio"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The principles that guide everything we do
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 h-full text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <value.icon className="w-8 h-8 text-gray-900 dark:text-gray-100" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
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
              className="relative h-[500px] rounded-2xl overflow-hidden order-2 lg:order-1"
            >
              <img
                src="https://images.pexels.com/photos/6186511/pexels-photo-6186511.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Quality materials"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-4xl font-bold mb-6">Uncompromising Quality</h2>
              <div className="space-y-4 text-lg text-gray-600 dark:text-gray-400">
                <p>
                  Quality isn't just a buzzword for us - it's the foundation of everything we create. From the moment you browse our collection to the day your print arrives at your door, you'll experience the Artio difference.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span>Museum-grade archival paper rated to last 100+ years</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span>Premium pigment inks with exceptional color accuracy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span>Professional packaging to ensure pristine delivery</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span>Certificate of authenticity with every purchase</span>
                  </li>
                </ul>
              </div>
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
            <h2 className="text-4xl font-bold">Join the Artio Community</h2>
            <p className="text-xl text-gray-300">
              Discover how the right art can transform your space and elevate your everyday experience
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
