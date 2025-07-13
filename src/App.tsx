import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Heart, Calculator, Users, CreditCard, Loader2 } from 'lucide-react';
import { AuthForm } from './components/AuthForm';
import { GradeCalculator } from './components/GradeCalculator';
import { blink } from './lib/blink';
import { toast } from 'react-hot-toast';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'auth' | 'calculator'>('home');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Auth state listener für Blink SDK
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setIsLoading(state.isLoading);
      
      if (state.isAuthenticated && state.user) {
        toast.success(`Willkommen zurück, ${state.user.email}!`);
        setCurrentView('calculator');
      }
    });

    return unsubscribe;
  }, []);

  const handleContinueWithoutLogin = () => {
    setCurrentView('calculator');
  };

  const handleShowAuth = () => {
    setCurrentView('auth');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleAuthSuccess = () => {
    setCurrentView('calculator');
  };

  const handlePayPalDonate = () => {
    window.open('https://www.paypal.me/notenmeisterplus', '_blank');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-slate-600">Lade Anwendung...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wenn bereits authentifiziert, direkt zum Rechner
  if (isAuthenticated && currentView === 'home') {
    return (
      <GradeCalculator 
        onBack={handleBackToHome} 
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // Auth Form
  if (currentView === 'auth') {
    return (
      <AuthForm 
        onBack={handleBackToHome}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // Calculator View
  if (currentView === 'calculator') {
    return (
      <GradeCalculator 
        onBack={handleBackToHome} 
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hauptkarte */}
        <Card className="mb-6">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 break-words">
              Notenrechner
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-slate-600 break-words">
              Berechnen Sie Ihre Noten einfach und übersichtlich
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Button 
              onClick={handleShowAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm sm:text-base"
            >
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="break-words">Anmelden / Registrieren</span>
            </Button>
            
            <Button 
              onClick={handleContinueWithoutLogin}
              variant="outline"
              className="w-full py-3 text-slate-700 border-slate-300 hover:bg-slate-100 text-sm sm:text-base"
            >
              <Calculator className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="break-words">Ohne Anmeldung fortfahren</span>
            </Button>
            
            <p className="text-xs sm:text-sm text-slate-500 text-center mt-4 break-words leading-relaxed">
              Mit einem Konto werden Ihre Daten automatisch gespeichert und synchronisiert
            </p>
          </CardContent>
        </Card>

        {/* PayPal Spenden-Karte */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-800 text-base sm:text-lg break-words">
              <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span>Projekt unterstützen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-center">
              <p className="text-blue-700 text-xs sm:text-sm mb-3 break-words leading-relaxed">
                Gefällt Ihnen der Notenrechner? Unterstützen Sie die Entwicklung!
              </p>
              <Button 
                onClick={handlePayPalDonate}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
              >
                <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="break-words">PayPal Spende</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;