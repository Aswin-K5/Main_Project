
import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";

  useEffect(() => {
    // Ensure mode is either login or signup, default to login otherwise
    if (mode !== "login" && mode !== "signup") {
      setSearchParams({ mode: "login" });
    }
  }, [mode, setSearchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-16 px-4 page-transition-in">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-block rounded-full bg-primary/10 p-2 mb-4">
              <div className="rounded-full bg-primary/20 p-2">
                <div className="rounded-full bg-primary p-2 text-white">
                  {mode === "login" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-log-in"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-user-plus"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="tabs flex justify-center mb-8">
            <div className="inline-flex rounded-full border overflow-hidden">
              <Link
                to="/auth?mode=login"
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                Login
              </Link>
              <Link
                to="/auth?mode=signup"
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                Sign Up
              </Link>
            </div>
          </div>
          
          {mode === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
