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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
              Notenrechner
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              Berechnen Sie Ihre Noten einfach und übersichtlich
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleShowAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <Users className="h-4 w-4 mr-2" />
              Anmelden / Registrieren
            </Button>
            
            <Button 
              onClick={handleContinueWithoutLogin}
              variant="outline"
              className="w-full py-3 text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Ohne Anmeldung fortfahren
            </Button>
            
            <p className="text-sm text-slate-500 text-center mt-4">
              Mit einem Konto werden Ihre Daten automatisch gespeichert und synchronisiert
            </p>
          </CardContent>
        </Card>

        {/* PayPal Spenden-Karte */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-800">
              <Heart className="h-5 w-5 text-red-500" />
              Projekt unterstützen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-blue-700 text-sm mb-3">
                Gefällt Ihnen der Notenrechner? Unterstützen Sie die Entwicklung!
              </p>
              <Button 
                onClick={handlePayPalDonate}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                PayPal Spende
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;