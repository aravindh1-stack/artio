import HeroSection from './HeroSection';
import FeatureGridSection from './FeatureGridSection';
import SignatureSection from './SignatureSection';
import CtaSection from './CtaSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black font-space-grotesk">
      <HeroSection />
      <FeatureGridSection />
      <SignatureSection />
      <CtaSection />
    </div>
  );
};

export default HomePage;
