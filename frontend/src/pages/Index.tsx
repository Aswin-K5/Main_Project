
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-transition-in">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
