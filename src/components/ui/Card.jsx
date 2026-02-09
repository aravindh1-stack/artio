import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hover = true,
  glass = false,
  ...props
}) => {
  const baseStyles = 'rounded-xl overflow-hidden';
  const glassStyles = glass
    ? 'glass-effect'
    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800';

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      className={`${baseStyles} ${glassStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
