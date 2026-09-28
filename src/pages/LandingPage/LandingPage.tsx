import { Benefits } from '../../components/Benefits/Benefits';
import { ExampleOpportunity } from '../../components/ExampleOpportunity/ExampleOpportunity';
import { FAQ } from '../../components/FAQ/FAQ';
import { Features } from '../../components/Features/Features';
import { FinalCTA } from '../../components/FinalCTA/FinalCTA';
import { Footer } from '../../components/Footer/Footer';
import { Hero } from '../../components/Hero/Hero';
import { HowItWorks } from '../../components/HowItWorks/HowItWorks';
import { MoneyAtRisk } from '../../components/MoneyAtRisk/MoneyAtRisk';
import { Navbar } from '../../components/Navbar/Navbar';
import { Pricing } from '../../components/Pricing/Pricing';
import { ProblemSection } from '../../components/ProblemSection/ProblemSection';
import { Recovery } from '../../components/Recovery/Recovery';
import { RoiCalculator } from '../../components/RoiCalculator/RoiCalculator';
import { SolutionSection } from '../../components/SolutionSection/SolutionSection';
import { TargetAudience } from '../../components/TargetAudience/TargetAudience';

export function LandingPage() {
  return (
    <div id="topo">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <MoneyAtRisk />
        <Features />
        <HowItWorks />
        <ExampleOpportunity />
        <Recovery />
        <TargetAudience />
        <Benefits />
        <RoiCalculator />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
