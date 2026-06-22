import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  Search,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import * as Sonner from "sonner";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Sonner.toast.error(error.message);
    } else {
      Sonner.toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-primary">
            <Store className="h-6 w-6" />
            <span>Gebeya</span>
          </Link>
          
          <div className="hidden md:flex ml-8 items-center gap-6">
            <Link to="/market" className="text-sm font-medium hover:text-primary transition-colors">Market</Link>
            <Link to="#" className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground">Categories</Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/create-listing" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Post Ad</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Join Free</Link>
              </Button>
            </>
          )}
        </div>

        <button 
          className="md:hidden p-2" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          <Link to="/market" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Market</Link>
          {user ? (
            <>
              <Link to="/create-listing" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Post Ad</Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Profile</Link>
              <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In / Join</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
