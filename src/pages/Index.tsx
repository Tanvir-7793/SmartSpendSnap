import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Receipt, PieChart, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-10 py-16">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Smart<span className="text-primary">Spend</span>Snap
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl text-gray-700">
            Effortlessly track your expenses with AI-powered receipt scanning
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate('/login')} 
              size="lg" 
              className="text-lg px-8"
            >
              Log In
            </Button>
            <Button 
              onClick={() => navigate('/signup')} 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
            >
              Sign Up
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center mb-16">Smart Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Scan Receipts</h3>
              <p className="text-gray-600">
                Simply take a photo of your receipt and our AI will automatically extract all the important details
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <PieChart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Visualize Spending</h3>
              <p className="text-gray-600">
                See where your money goes with beautiful charts and insights about your spending habits
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your financial data is encrypted and securely stored. We never share your information
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to take control of your finances?</h2>
          <Button 
            onClick={() => navigate('/signup')} 
            size="lg" 
            className="text-lg px-8"
          >
            Get Started for Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2023 SmartSpendSnap. All rights reserved.</p>
          <p className="text-sm mt-2">
            Built by Iconic Minds
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
