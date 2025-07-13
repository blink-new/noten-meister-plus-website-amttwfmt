import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, FileText, Globe, Smartphone } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

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

interface ExportUtilsProps {
  grades: Grade[];
  calculateAverage: (grades?: Grade[]) => number;
  getSubjects: () => Array<{
    name: string;
    grades: Grade[];
    average: number;
  }>;
}

export function ExportUtils({ grades, calculateAverage, getSubjects }: ExportUtilsProps) {
  const exportToPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(37, 99, 235); // Blue color
    pdf.text('Notenrechner Plus - Notenbericht', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, yPosition);
    yPosition += 20;

    // Gesamtdurchschnitt
    pdf.setFontSize(16);
    pdf.setTextColor(37, 99, 235);
    pdf.text('Gesamtdurchschnitt', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${calculateAverage().toFixed(2)} (basierend auf ${grades.length} Noten)`, margin, yPosition);
    yPosition += 20;

    // Fächer-Übersicht
    pdf.setFontSize(16);
    pdf.setTextColor(37, 99, 235);
    pdf.text('Fächer-Übersicht', margin, yPosition);
    yPosition += 15;

    const subjects = getSubjects();
    subjects.forEach((subject) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${subject.name}: ${subject.average.toFixed(2)} (${subject.grades.length} Noten)`, margin, yPosition);
      yPosition += 8;
    });

    // Detaillierte Notenliste
    if (grades.length > 0) {
      yPosition += 10;
      if (yPosition > 230) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Detaillierte Notenliste', margin, yPosition);
      yPosition += 15;

      grades.forEach((grade) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const gradeText = `${grade.subject} - Note: ${grade.grade.toFixed(1)} (Gewichtung: ${grade.weight}x)`;
        pdf.text(gradeText, margin, yPosition);
        yPosition += 6;

        if (grade.notes) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Notiz: ${grade.notes}`, margin + 10, yPosition);
          yPosition += 6;
        }
        yPosition += 2;
      });
    }

    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Seite ${i} von ${pageCount} - Erstellt mit Notenrechner Plus`, margin, 285);
    }

    pdf.save(`Notenbericht_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToHTML = () => {
    const subjects = getSubjects();
    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notenbericht - Notenrechner Plus</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #0F172A;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #F8FAFC;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #2563EB;
            margin: 0 0 10px 0;
            font-size: 2.5em;
        }
        .header p {
            color: #64748B;
            margin: 0;
        }
        .section {
            background: white;
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #2563EB;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .average-box {
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            margin: 15px 0;
        }
        .average-box .number {
            font-size: 2em;
            font-weight: bold;
            color: #2563EB;
        }
        .subject-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #F8FAFC;
            border-radius: 6px;
            border-left: 4px solid #2563EB;
        }
        .grade-item {
            padding: 8px;
            margin: 5px 0;
            background: #F8FAFC;
            border-radius: 4px;
            border-left: 3px solid #10B981;
        }
        .grade-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        .grade-excellent { background-color: #10B981; }
        .grade-good { background-color: #3B82F6; }
        .grade-satisfactory { background-color: #F59E0B; }
        .grade-poor { background-color: #EF4444; }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #64748B;
            font-size: 0.9em;
        }
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #E2E8F0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Notenbericht</h1>
        <p>Erstellt am ${new Date().toLocaleDateString('de-DE')} mit Notenrechner Plus</p>
    </div>

    <div class="section">
        <h2>🎯 Gesamtdurchschnitt</h2>
        <div class="average-box">
            <div class="number">${calculateAverage().toFixed(2)}</div>
            <p>Basierend auf ${grades.length} Noten</p>
        </div>
    </div>

    <div class="section">
        <h2>📚 Fächer-Übersicht</h2>
        ${subjects.map(subject => `
            <div class="subject-item">
                <div>
                    <strong>${subject.name}</strong>
                    <br><small>${subject.grades.length} Note${subject.grades.length !== 1 ? 'n' : ''}</small>
                </div>
                <div>
                    <span class="grade-badge ${subject.average <= 2 ? 'grade-excellent' : 
                                              subject.average <= 3 ? 'grade-good' : 
                                              subject.average <= 4 ? 'grade-satisfactory' : 'grade-poor'}">
                        ${subject.average.toFixed(2)}
                    </span>
                </div>
            </div>
        `).join('')}
    </div>

    ${grades.length > 0 ? `
    <div class="section">
        <h2>📝 Detaillierte Notenliste</h2>
        ${grades.map(grade => `
            <div class="grade-item">
                <strong>${grade.subject}</strong> - 
                <span class="grade-badge ${grade.grade <= 2 ? 'grade-excellent' : 
                                          grade.grade <= 3 ? 'grade-good' : 
                                          grade.grade <= 4 ? 'grade-satisfactory' : 'grade-poor'}">
                    ${grade.grade.toFixed(1)}
                </span>
                (Gewichtung: ${grade.weight}x)
                ${grade.notes ? `<br><small style="color: #64748B;">💭 ${grade.notes}</small>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p>📱 Erstellt mit <strong>Notenrechner Plus</strong></p>
        <p>🌐 Verfügbar als Progressive Web App (PWA)</p>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `Notenbericht_${new Date().toISOString().split('T')[0]}.html`);
  };

  const installPWA = () => {
    // Check if PWA can be installed
    if ('serviceWorker' in navigator) {
      // Show install prompt or instructions
      alert('Diese App kann als PWA installiert werden! Nutzen Sie das "Zum Startbildschirm hinzufügen" Menü in Ihrem Browser.');
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Download className="h-5 w-5" />
          Export & PWA Funktionen
        </CardTitle>
        <CardDescription className="text-blue-700">
          Exportieren Sie Ihre Noten oder installieren Sie die App
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            onClick={exportToPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={grades.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF Export
          </Button>
          
          <Button 
            onClick={exportToHTML}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={grades.length === 0}
          >
            <Globe className="h-4 w-4 mr-2" />
            HTML Export
          </Button>
          
          <Button 
            onClick={installPWA}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            PWA installieren
          </Button>
          
          <Button 
            onClick={() => window.print()}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
        
        {grades.length === 0 && (
          <p className="text-sm text-blue-600 mt-3 text-center">
            💡 Fügen Sie Noten hinzu, um Export-Funktionen zu nutzen
          </p>
        )}
      </CardContent>
    </Card>
  );
}