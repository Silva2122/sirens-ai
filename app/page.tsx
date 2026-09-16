import Contacts from "@/components/Contacts";
import Diagnostics from "@/components/Diagnostics";
import Footer from "@/components/Footer";
import GlassEffects from "@/components/GlassEffects";
import Header from "@/components/Header";
import HeroScroll from "@/components/HeroScroll";
import Philosophy from "@/components/Philosophy";
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
      <Why />
      <Services />
      <Philosophy />
      <Diagnostics />
      <Team />
      <Contacts />
      <Footer />
    </div>
  );
}
