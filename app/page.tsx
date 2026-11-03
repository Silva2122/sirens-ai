import Contacts from "@/components/Contacts";
import Diagnostics from "@/components/Diagnostics";
import Footer from "@/components/Footer";
import GlassEffects from "@/components/GlassEffects";
import Header from "@/components/Header";
import HeroScroll from "@/components/HeroScroll";
import LeadModal from "@/components/LeadModal";
import LegalModal from "@/components/LegalModal";
import Philosophy from "@/components/Philosophy";
import QuizModal from "@/components/QuizModal";
import Preloader from "@/components/Preloader";
import Reveal from "@/components/Reveal";
import Services from "@/components/Services";
import Team from "@/components/Team";
import Why from "@/components/Why";

export default function Page() {
  return (
    <div className="page">
      <Preloader />
      <GlassEffects />
      <Reveal />
      <Header />
      <HeroScroll />
      <Services />
      <Why />
      <Philosophy />
      <Diagnostics />
      <Team />
      <Contacts />
      <Footer />
      <LeadModal />
      <QuizModal />
      <LegalModal />
    </div>
  );
}
