
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, UploadCloud, ArrowRight } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAuthenticated = false; // Will be replaced with actual auth logic

  const navItems = [
    { label: "Features", path: "/#features" },
    { label: "How It Works", path: "/#how-it-works" },
    { label: "About", path: "/#about" },
  ];

  const authenticatedNavItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "History", path: "/history" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-2 bg-background/80 backdrop-blur-md shadow-sm" : "py-4 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-2xl font-bold flex items-center group"
          >
            <span className="text-primary mr-1 group-hover:animate-wave inline-block origin-bottom-right">⚡</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              MeterEase
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {authenticatedNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button className="ml-2">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Reading
                </Button>
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex items-center space-x-2">
                  <Link to="/auth?mode=login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button>
                      Get Started
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-panel animate-slide-down mt-2 py-4 px-4 mx-4 rounded-lg">
          <nav className="flex flex-col space-y-4">
            {isAuthenticated ? (
              <>
                {authenticatedNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-foreground/80 py-2 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button className="w-full mt-2">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Reading
                </Button>
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-foreground/80 py-2 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-2">
                  <Link to="/auth?mode=login">
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button className="w-full">
                      Get Started
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
