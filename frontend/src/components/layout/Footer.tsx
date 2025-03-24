
import { Link } from "react-router-dom";
import { Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/50 pt-10 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <Link to="/" className="text-2xl font-bold flex items-center justify-center mb-4">
              <span className="text-primary mr-1">⚡</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                MeterEase
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Simplifying electricity meter readings with AI-powered automation.
            </p>
            <div className="flex space-x-4 justify-center">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="mailto:info@meterease.example" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8">
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              © {currentYear} MeterEase. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
