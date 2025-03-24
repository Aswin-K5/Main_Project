
import { ArrowRight, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-32 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 mb-12">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-accent text-accent-foreground mb-4 animate-fade-in">
            <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Simplify your meter reading experience
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl animate-slide-up">
            Automated Electricity Meter{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Reading
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Upload or capture your electric meter image and let our AI do the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/dashboard">
              <Button size="lg" className="rounded-full px-8">
                Start Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8"
              onClick={scrollToFeatures}
            >
              Learn More
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
