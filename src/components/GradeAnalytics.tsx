import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Target
} from 'lucide-react';

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

interface GradeAnalyticsProps {
  grades: Grade[];
}

export function GradeAnalytics({ grades }: GradeAnalyticsProps) {
  // Daten für Fächer-Durchschnitt
  const getSubjectAverages = () => {
    const subjects = [...new Set(grades.map(g => g.subject))];
    return subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subject === subject);
      const totalWeight = subjectGrades.reduce((sum, g) => sum + g.weight, 0);
      const weightedSum = subjectGrades.reduce((sum, g) => sum + (g.grade * g.weight), 0);
      const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      return {
        subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
        fullSubject: subject,
        average: parseFloat(average.toFixed(2)),
        count: subjectGrades.length
      };
    }).sort((a, b) => a.average - b.average);
  };

  // Daten für Noten-Verteilung
  const getGradeDistribution = () => {
    const distribution = {
      '1.0-1.5': 0,
      '1.6-2.0': 0,
      '2.1-2.5': 0,
      '2.6-3.0': 0,
      '3.1-3.5': 0,
      '3.6-4.0': 0,
      '4.1+': 0
    };

    grades.forEach(grade => {
      if (grade.grade <= 1.5) distribution['1.0-1.5']++;
      else if (grade.grade <= 2.0) distribution['1.6-2.0']++;
      else if (grade.grade <= 2.5) distribution['2.1-2.5']++;
      else if (grade.grade <= 3.0) distribution['2.6-3.0']++;
      else if (grade.grade <= 3.5) distribution['3.1-3.5']++;
      else if (grade.grade <= 4.0) distribution['3.6-4.0']++;
      else distribution['4.1+']++;
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: grades.length > 0 ? ((count / grades.length) * 100).toFixed(1) : '0'
    }));
  };

  // Daten für Zeitverlauf
  const getTimelineData = () => {
    const sortedGrades = [...grades].sort((a, b) => 
      new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );

    let runningSum = 0;
    let runningWeight = 0;

    return sortedGrades.map((grade, index) => {
      runningSum += grade.grade * grade.weight;
      runningWeight += grade.weight;
      const average = runningWeight > 0 ? runningSum / runningWeight : 0;

      return {
        index: index + 1,
        average: parseFloat(average.toFixed(2)),
        date: new Date(grade.dateCreated).toLocaleDateString('de-DE'),
        subject: grade.subject,
        grade: grade.grade
      };
    });
  };

  // Daten für Prüfungstypen
  const getExamTypeData = () => {
    const types = [...new Set(grades.map(g => g.examType))];
    return types.map(type => {
      const typeGrades = grades.filter(g => g.examType === type);
      const average = typeGrades.reduce((sum, g) => sum + g.grade, 0) / typeGrades.length;
      
      const typeNames: { [key: string]: string } = {
        'regular': 'Regulär',
        'exam': 'Klausur',
        'homework': 'Hausaufgabe',
        'presentation': 'Präsentation',
        'project': 'Projekt'
      };

      return {
        type: typeNames[type] || type,
        average: parseFloat(average.toFixed(2)),
        count: typeGrades.length
      };
    });
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  const subjectAverages = getSubjectAverages();
  const gradeDistribution = getGradeDistribution();
  const timelineData = getTimelineData();
  const examTypeData = getExamTypeData();

  const overallAverage = grades.length > 0 ? 
    grades.reduce((sum, g) => sum + (g.grade * g.weight), 0) / 
    grades.reduce((sum, g) => sum + g.weight, 0) : 0;

  const trend = timelineData.length > 1 ? 
    timelineData[timelineData.length - 1].average - timelineData[0].average : 0;

  if (grades.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-slate-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Keine Daten für Analyse</p>
              <p className="text-sm">Fügen Sie Noten hinzu, um Analysen zu sehen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Übersichts-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtdurchschnitt</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverage.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {trend > 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  <span className="text-red-500">+{trend.toFixed(2)}</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
                  <span className="text-blue-500">{trend.toFixed(2)}</span>
                </>
              ) : (
                <span>Keine Änderung</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beste Note</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.min(...grades.map(g => g.grade)).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ihre beste Leistung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schlechteste Note</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.max(...grades.map(g => g.grade)).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Verbesserungspotential
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anzahl Noten</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground">
              Eingetragene Noten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fächer-Durchschnitt Balkendiagramm */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Durchschnitt pro Fach
          </CardTitle>
          <CardDescription>
            Vergleich der Durchschnittsnoten in verschiedenen Fächern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[1, 6]}
                  reversed
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${value}`,
                    'Durchschnitt'
                  ]}
                  labelFormatter={(label: any, payload: any) => {
                    const data = payload?.[0]?.payload;
                    return data ? `${data.fullSubject} (${data.count} Noten)` : label;
                  }}
                />
                <Bar 
                  dataKey="average" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Noten-Verteilung Kreisdiagramm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Noten-Verteilung
            </CardTitle>
            <CardDescription>
              Verteilung Ihrer Noten nach Bereichen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percentage }) => `${range} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {gradeDistribution.filter(d => d.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} Noten`, 'Anzahl']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prüfungstypen */}
        <Card>
          <CardHeader>
            <CardTitle>Leistung nach Prüfungstyp</CardTitle>
            <CardDescription>
              Durchschnittsnoten nach Art der Prüfung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {examTypeData.map((type, index) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{type.type}</span>
                    <Badge variant="secondary">{type.count} Noten</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{type.average}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zeitverlauf */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Entwicklung des Durchschnitts
          </CardTitle>
          <CardDescription>
            Wie sich Ihr Notendurchschnitt über die Zeit entwickelt hat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="index" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Note Nr.', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={[1, 6]}
                  reversed
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Durchschnitt', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}`, 'Durchschnitt']}
                  labelFormatter={(label: any, payload: any) => {
                    const data = payload?.[0]?.payload;
                    return data ? `Note ${label}: ${data.subject} (${data.grade})` : `Note ${label}`;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}