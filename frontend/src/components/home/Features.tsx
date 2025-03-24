
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { 
  Upload, BarChart3, FileText, Shield,
  Camera, BarChart, Zap, ArrowUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Features = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const features = [
    {
      icon: <Upload className="h-8 w-8 text-primary" />,
      title: "Easy Uploads",
      description: "Simply upload a photo of your electricity meter to instantly extract readings.",
      delay: 0
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Consumption Insights",
      description: "Track and analyze your electricity usage patterns with detailed visualizations.",
      delay: 1
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Bill Generation",
      description: "Automatically generate accurate bills based on your consumption data.",
      delay: 2
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure & Private",
      description: "Your data is encrypted and securely stored with enterprise-grade protection.",
      delay: 3
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Meter Image",
      description: "Take a photo of your electricity meter or upload an existing image (max 5MB)."
    },
    {
      number: "02",
      title: "Automatic Reading",
      description: "Our AI instantly processes the image and extracts the meter reading."
    },
    {
      number: "03",
      title: "Generate & Pay Bill",
      description: "Calculate your bill based on current and previous readings, then download as PDF."
    }
  ];

  return (
    <>
      <section id="features" className="py-24 bg-secondary/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Our platform offers everything you need to manage your electricity consumption effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard 
                key={index} 
                className="bg-background p-6 flex flex-col h-full hover-lift"
                delay={feature.delay}
              >
                <div className="rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              MeterEase makes monitoring your electricity usage simple and effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {steps.map((step, index) => (
              <div key={index} className="text-center flex flex-col items-center">
                <div className="text-6xl font-bold text-primary/80 mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-medium mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 border-t border-border pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">User Flow Process</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Start Page: Click "Start Now" to begin the process</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Upload Page: Capture image or upload meter reading photo</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Consumption Page: View current and previous readings</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">4</div>
                    <div>
                      <p className="font-medium">Payment Section: Calculate bill and download PDF</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-secondary/30 p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Upload Requirements</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 text-primary mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Clear image of your electricity meter</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 text-primary mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Maximum file size of 5MB</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 text-primary mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Supported formats: JPG, PNG, HEIC</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 text-primary mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Good lighting for better reading accuracy</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-16">
            <Link to="/dashboard">
              <Button size="lg" className="rounded-full px-8">
                Start Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
};

export default Features;
