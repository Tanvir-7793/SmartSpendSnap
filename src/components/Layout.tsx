
import { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  BarChart4, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b py-3 px-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">
            Smart<span className="text-primary">Spend</span>Snap
          </h1>
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-white border-b shadow-lg animate-in slide-in-from-top-5">
            <div className="flex flex-col py-2">
              <Link 
                to="/dashboard" 
                className="flex items-center px-4 py-3 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="mr-3 h-5 w-5 text-primary" />
                Dashboard
              </Link>
              <Link 
                to="/add-transaction" 
                className="flex items-center px-4 py-3 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <PlusCircle className="mr-3 h-5 w-5 text-primary" />
                Add Transaction
              </Link>
              <Link 
                to="/reports" 
                className="flex items-center px-4 py-3 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart4 className="mr-3 h-5 w-5 text-primary" />
                Reports
              </Link>
              <Link 
                to="/settings" 
                className="flex items-center px-4 py-3 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="mr-3 h-5 w-5 text-primary" />
                Settings
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center px-4 py-3 hover:bg-gray-100 text-left"
              >
                <LogOut className="mr-3 h-5 w-5 text-primary" />
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
          <div className="flex-1 flex flex-col min-h-0 pt-5">
            <div className="px-4 mb-6">
              <h1 className="text-xl font-bold tracking-tight">
                Smart<span className="text-primary">Spend</span>Snap
              </h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
              <Link to="/dashboard" className="flex items-center px-3 py-3 text-gray-800 rounded-md hover:bg-gray-100">
                <Home className="mr-3 h-5 w-5 text-primary" />
                Dashboard
              </Link>
              <Link to="/add-transaction" className="flex items-center px-3 py-3 text-gray-800 rounded-md hover:bg-gray-100">
                <PlusCircle className="mr-3 h-5 w-5 text-primary" />
                Add Transaction
              </Link>
              <Link to="/reports" className="flex items-center px-3 py-3 text-gray-800 rounded-md hover:bg-gray-100">
                <BarChart4 className="mr-3 h-5 w-5 text-primary" />
                Reports
              </Link>
              <Link to="/settings" className="flex items-center px-3 py-3 text-gray-800 rounded-md hover:bg-gray-100">
                <Settings className="mr-3 h-5 w-5 text-primary" />
                Settings
              </Link>
            </nav>
            <div className="px-4 py-4 border-t">
              <Button 
                variant="ghost" 
                className="flex items-center w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:pl-64">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-6 flex justify-between z-10">
        <Link to="/dashboard" className="flex flex-col items-center text-xs">
          <Home className="h-6 w-6 text-primary mb-1" />
          Home
        </Link>
        <Link to="/add-transaction" className="flex flex-col items-center text-xs">
          <PlusCircle className="h-6 w-6 text-primary mb-1" />
          Add
        </Link>
        <Link to="/reports" className="flex flex-col items-center text-xs">
          <BarChart4 className="h-6 w-6 text-primary mb-1" />
          Reports
        </Link>
        <Link to="/settings" className="flex flex-col items-center text-xs">
          <Settings className="h-6 w-6 text-primary mb-1" />
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Layout;
