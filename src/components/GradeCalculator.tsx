import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { blink } from '../lib/blink';
import { toast } from 'react-hot-toast';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  BarChart3, 
  TrendingUp, 
  Award,
  BookOpen,
  Target,
  Heart,
  CreditCard,
  LogOut,
  Download,
  Users
} from 'lucide-react';
import { GradeAnalytics } from './GradeAnalytics';
import { ExportUtils } from './ExportUtils';
import { ClassroomManager } from './ClassroomManager';
import { ClassroomView } from './ClassroomView';

interface Grade {
  id: string;
  subject: string;
  grade: number;
  weight: number;
  examType: string;
  dateCreated: string;
  semester: string;
  notes?: string;
}

interface GradeCalculatorProps {
  onBack: () => void;
  isAuthenticated: boolean;
}

export function GradeCalculator({ onBack, isAuthenticated }: GradeCalculatorProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [newGrade, setNewGrade] = useState({
    subject: '',
    grade: '',
    weight: '1',
    examType: 'regular',
    semester: 'current',
    notes: ''
  });
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      loadGrades();
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      const userData = await blink.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadGrades = async () => {
    if (!isAuthenticated) return;
    
    try {
      const userData = await blink.auth.me();
      const gradesData = await blink.db.grades.list({
        where: { userId: userData.id },
        orderBy: { dateCreated: 'desc' }
      });
      
      setGrades(gradesData.map((g: any) => ({
        id: g.id,
        subject: g.subject,
        grade: g.grade,
        weight: g.weight,
        examType: g.exam_type,
        dateCreated: g.date_created,
        semester: g.semester,
        notes: g.notes
      })));
    } catch (error) {
      console.error('Error loading grades:', error);
      toast.error('Fehler beim Laden der Noten');
    }
  };

  const addGrade = async () => {
    if (!newGrade.subject || !newGrade.grade) {
      toast.error('Bitte Fach und Note eingeben');
      return;
    }

    const gradeValue = parseFloat(newGrade.grade);
    if (isNaN(gradeValue) || gradeValue < 1 || gradeValue > 6) {
      toast.error('Note muss zwischen 1 und 6 liegen');
      return;
    }

    try {
      if (isAuthenticated) {
        const userData = await blink.auth.me();
        await blink.db.grades.create({
          userId: userData.id,
          subject: newGrade.subject,
          grade: gradeValue,
          weight: parseFloat(newGrade.weight),
          examType: newGrade.examType,
          semester: newGrade.semester,
          notes: newGrade.notes
        });
        
        await loadGrades();
        toast.success('Note hinzugefügt');
      } else {
        // Lokale Speicherung für Gäste
        const localGrade: Grade = {
          id: Date.now().toString(),
          subject: newGrade.subject,
          grade: gradeValue,
          weight: parseFloat(newGrade.weight),
          examType: newGrade.examType,
          dateCreated: new Date().toISOString(),
          semester: newGrade.semester,
          notes: newGrade.notes
        };
        setGrades([localGrade, ...grades]);
        toast.success('Note hinzugefügt (lokal gespeichert)');
      }

      setNewGrade({
        subject: '',
        grade: '',
        weight: '1',
        examType: 'regular',
        semester: 'current',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding grade:', error);
      toast.error('Fehler beim Hinzufügen der Note');
    }
  };

  const deleteGrade = async (gradeId: string) => {
    try {
      if (isAuthenticated) {
        await blink.db.grades.delete(gradeId);
        await loadGrades();
      } else {
        setGrades(grades.filter(g => g.id !== gradeId));
      }
      toast.success('Note gelöscht');
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error('Fehler beim Löschen der Note');
    }
  };

  const calculateAverage = (subjectGrades?: Grade[]) => {
    const gradesToCalculate = subjectGrades || grades;
    if (gradesToCalculate.length === 0) return 0;
    
    const totalWeight = gradesToCalculate.reduce((sum, g) => sum + g.weight, 0);
    const weightedSum = gradesToCalculate.reduce((sum, g) => sum + (g.grade * g.weight), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const getSubjects = () => {
    const subjects = [...new Set(grades.map(g => g.subject))];
    return subjects.map(subject => ({
      name: subject,
      grades: grades.filter(g => g.subject === subject),
      average: calculateAverage(grades.filter(g => g.subject === subject))
    }));
  };

  const handleLogout = () => {
    blink.auth.logout();
    onBack();
  };

  const handlePayPalDonate = () => {
    window.open('https://www.paypal.me/notenmeisterplus', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Notenrechner</h1>
            <p className="text-slate-600">
              {isAuthenticated && user ? 
                `Willkommen zurück, ${user.email}!` : 
                'Berechnen Sie Ihre Noten einfach und übersichtlich'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-slate-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onBack}
              className="text-slate-600"
            >
              Zurück
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Rechner
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="classrooms" className="flex items-center gap-2" disabled={!isAuthenticated}>
              <Users className="h-4 w-4" />
              Klassenzimmer
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            {/* Neue Note hinzufügen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Neue Note hinzufügen
                </CardTitle>
                <CardDescription>
                  Geben Sie Ihre Note ein und sie wird automatisch in die Berechnung einbezogen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Fach</Label>
                    <Input
                      id="subject"
                      placeholder="z.B. Mathematik"
                      value={newGrade.subject}
                      onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grade">Note (1-6)</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="1"
                      max="6"
                      step="0.1"
                      placeholder="z.B. 2.3"
                      value={newGrade.grade}
                      onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Gewichtung</Label>
                    <Select value={newGrade.weight} onValueChange={(value) => setNewGrade({ ...newGrade, weight: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5x (Hausaufgabe)</SelectItem>
                        <SelectItem value="1">1x (Normal)</SelectItem>
                        <SelectItem value="2">2x (Klausur)</SelectItem>
                        <SelectItem value="3">3x (Wichtige Prüfung)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="examType">Typ</Label>
                    <Select value={newGrade.examType} onValueChange={(value) => setNewGrade({ ...newGrade, examType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regulär</SelectItem>
                        <SelectItem value="exam">Klausur</SelectItem>
                        <SelectItem value="homework">Hausaufgabe</SelectItem>
                        <SelectItem value="presentation">Präsentation</SelectItem>
                        <SelectItem value="project">Projekt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button onClick={addGrade} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Note hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notenliste */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Ihre Noten
                  {grades.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {grades.length} Noten
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Noten eingetragen</p>
                    <p className="text-sm">Fügen Sie Ihre erste Note hinzu, um zu beginnen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {grades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-800">{grade.subject}</span>
                            <Badge 
                              variant={grade.grade <= 2 ? "default" : grade.grade <= 3 ? "secondary" : "destructive"}
                              className="text-sm"
                            >
                              {grade.grade.toFixed(1)}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              Gewichtung: {grade.weight}x
                            </span>
                            <span className="text-sm text-slate-500">
                              {grade.examType === 'exam' ? 'Klausur' : 
                               grade.examType === 'homework' ? 'Hausaufgabe' :
                               grade.examType === 'presentation' ? 'Präsentation' :
                               grade.examType === 'project' ? 'Projekt' : 'Regulär'}
                            </span>
                          </div>
                          {grade.notes && (
                            <p className="text-sm text-slate-600 mt-1">{grade.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGrade(grade.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <GradeAnalytics grades={grades} />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {/* Gesamtübersicht */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gesamtdurchschnitt</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {grades.length > 0 ? calculateAverage().toFixed(2) : '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Basierend auf {grades.length} Noten
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Anzahl Fächer</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getSubjects().length}</div>
                  <p className="text-xs text-muted-foreground">
                    Verschiedene Fächer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Beste Note</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {grades.length > 0 ? Math.min(...grades.map(g => g.grade)).toFixed(1) : '0.0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ihre beste Leistung
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Fächer-Übersicht */}
            <Card>
              <CardHeader>
                <CardTitle>Fächer-Übersicht</CardTitle>
                <CardDescription>
                  Durchschnittsnoten pro Fach
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getSubjects().length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Fächer vorhanden</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSubjects().map((subject) => (
                      <div key={subject.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-slate-800">{subject.name}</h3>
                          <p className="text-sm text-slate-600">
                            {subject.grades.length} Note{subject.grades.length !== 1 ? 'n' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {subject.average.toFixed(2)}
                          </div>
                          <Badge 
                            variant={subject.average <= 2 ? "default" : subject.average <= 3 ? "secondary" : "destructive"}
                          >
                            {subject.average <= 2 ? 'Sehr gut' : 
                             subject.average <= 3 ? 'Gut' : 
                             subject.average <= 4 ? 'Befriedigend' : 'Verbesserung nötig'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportUtils 
              grades={grades}
              calculateAverage={calculateAverage}
              getSubjects={getSubjects}
            />
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-6">
            {!isAuthenticated ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Anmeldung erforderlich</h3>
                  <p className="text-slate-600 mb-4">
                    Melden Sie sich an, um Klassenzimmer zu erstellen und Noten mit Freunden zu teilen
                  </p>
                  <Button onClick={onBack}>
                    Zur Anmeldung
                  </Button>
                </CardContent>
              </Card>
            ) : selectedClassroom ? (
              <ClassroomView 
                classroom={selectedClassroom}
                onBack={() => setSelectedClassroom(null)}
                userGrades={grades}
              />
            ) : (
              <ClassroomManager 
                onClassroomSelect={setSelectedClassroom}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* PayPal Spenden-Sektion - Position 175px */}
        <Card className="border-blue-200 bg-blue-50 mt-8 endnote-175">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Heart className="h-5 w-5 text-red-500" />
              Unterstützen Sie das Projekt
            </CardTitle>
            <CardDescription className="text-blue-700">
              Helfen Sie uns, den Notenrechner weiterzuentwickeln
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-blue-700 mb-4">
                Wenn Ihnen der Notenrechner gefällt, können Sie uns gerne mit einer kleinen Spende unterstützen.
              </p>
              <Button 
                onClick={handlePayPalDonate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Mit PayPal spenden
              </Button>
              <p className="text-sm text-blue-600 mt-2">
                Sicher über PayPal - notenmeisterplus
              </p>
              <Badge className="mt-2 endnote-175" variant="outline">
                Endnote Badge - Position 175
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}