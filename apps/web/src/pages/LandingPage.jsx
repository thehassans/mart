import SiteHeader from '../components/layout/SiteHeader.jsx';
import HeroSection from '../components/marketing/HeroSection.jsx';
import FeaturesGrid from '../components/marketing/FeaturesGrid.jsx';
import PricingTable from '../components/marketing/PricingTable.jsx';
import MarketingFooter from '../components/marketing/MarketingFooter.jsx';

export default function LandingPage() {
  return (
    <div>
      <SiteHeader />
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesGrid />
        </div>
        <div id="pricing">
          <PricingTable />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
