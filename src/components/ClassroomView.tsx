import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { blink } from '../lib/blink';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Share2, 
  Users, 
  Copy, 
  Trophy, 
  TrendingUp,
  MessageCircle,
  Send,
  BookOpen,
  Target,
  Award
} from 'lucide-react';
import type { RealtimeChannel } from '@blinkdotnew/sdk';

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  memberCount?: number;
  role?: string;
}

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

interface SharedGrade {
  id: string;
  classroomId: string;
  userId: string;
  subject: string;
  grade: number;
  weight: number;
  examType: string;
  semester: string;
  notes?: string;
  sharedAt: string;
  userEmail?: string;
}

interface ClassroomMessage {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: number;
}

interface OnlineUser {
  userId: string;
  email: string;
  joinedAt: number;
}

interface ClassroomViewProps {
  classroom: Classroom;
  onBack: () => void;
  userGrades: Grade[];
}

export function ClassroomView({ classroom, onBack, userGrades }: ClassroomViewProps) {
  const [sharedGrades, setSharedGrades] = useState<SharedGrade[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [selectedGradeToShare, setSelectedGradeToShare] = useState<string>('');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUser();
    loadSharedGrades();
    setupRealtimeConnection();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUser = async () => {
    try {
      const userData = await blink.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadSharedGrades = async () => {
    try {
      const gradesData = await blink.db.sharedGrades.list({
        where: { classroomId: classroom.id },
        orderBy: { sharedAt: 'desc' }
      });

      // Get user emails for each grade
      const gradesWithUsers = await Promise.all(
        gradesData.map(async (grade: any) => {
          try {
            // Note: In a real app, you'd have a users table to lookup emails
            // For now, we'll use the userId as a placeholder
            return {
              id: grade.id,
              classroomId: grade.classroom_id,
              userId: grade.user_id,
              subject: grade.subject,
              grade: grade.grade,
              weight: grade.weight,
              examType: grade.exam_type,
              semester: grade.semester,
              notes: grade.notes,
              sharedAt: grade.shared_at,
              userEmail: grade.user_id // Placeholder - in real app would lookup email
            };
          } catch (error) {
            return {
              id: grade.id,
              classroomId: grade.classroom_id,
              userId: grade.user_id,
              subject: grade.subject,
              grade: grade.grade,
              weight: grade.weight,
              examType: grade.exam_type,
              semester: grade.semester,
              notes: grade.notes,
              sharedAt: grade.shared_at,
              userEmail: 'Unbekannt'
            };
          }
        })
      );

      setSharedGrades(gradesWithUsers);
    } catch (error) {
      console.error('Error loading shared grades:', error);
      toast.error('Fehler beim Laden der geteilten Noten');
    }
  };

  const setupRealtimeConnection = async () => {
    if (!user) return;

    try {
      const userData = await blink.auth.me();
      const channel = blink.realtime.channel(`classroom-${classroom.id}`);
      channelRef.current = channel;

      await channel.subscribe({
        userId: userData.id,
        metadata: { 
          email: userData.email,
          classroomId: classroom.id
        }
      });

      // Listen for messages
      channel.onMessage((message) => {
        if (message.type === 'chat') {
          setMessages(prev => [...prev, {
            id: message.id,
            userId: message.userId,
            userEmail: message.metadata?.email || 'Unbekannt',
            message: message.data.text,
            timestamp: message.timestamp
          }]);
        } else if (message.type === 'grade-shared') {
          // Reload shared grades when someone shares a new grade
          loadSharedGrades();
          toast.success(`${message.metadata?.email || 'Jemand'} hat eine neue Note geteilt!`);
        }
      });

      // Listen for presence changes
      channel.onPresence((users) => {
        setOnlineUsers(users.map(u => ({
          userId: u.userId,
          email: u.metadata?.email || 'Unbekannt',
          joinedAt: u.joinedAt
        })));
      });

      // Load recent messages
      const recentMessages = await channel.getMessages({ limit: 50 });
      setMessages(recentMessages
        .filter(msg => msg.type === 'chat')
        .map(msg => ({
          id: msg.id,
          userId: msg.userId,
          userEmail: msg.metadata?.email || 'Unbekannt',
          message: msg.data.text,
          timestamp: msg.timestamp
        }))
      );

    } catch (error) {
      console.error('Error setting up realtime connection:', error);
      toast.error('Fehler bei der Verbindung zum Klassenzimmer');
    }
  };

  const shareGrade = async () => {
    if (!selectedGradeToShare) {
      toast.error('Bitte wählen Sie eine Note zum Teilen aus');
      return;
    }

    try {
      const userData = await blink.auth.me();
      const gradeToShare = userGrades.find(g => g.id === selectedGradeToShare);
      
      if (!gradeToShare) {
        toast.error('Note nicht gefunden');
        return;
      }

      // Save to shared grades
      await blink.db.sharedGrades.create({
        classroomId: classroom.id,
        userId: userData.id,
        subject: gradeToShare.subject,
        grade: gradeToShare.grade,
        weight: gradeToShare.weight,
        examType: gradeToShare.examType,
        semester: gradeToShare.semester,
        notes: gradeToShare.notes
      });

      // Notify other users via realtime
      if (channelRef.current) {
        await channelRef.current.publish('grade-shared', {
          subject: gradeToShare.subject,
          grade: gradeToShare.grade
        }, {
          userId: userData.id,
          metadata: { email: userData.email }
        });
      }

      toast.success('Note erfolgreich geteilt!');
      setSelectedGradeToShare('');
      loadSharedGrades();
    } catch (error) {
      console.error('Error sharing grade:', error);
      toast.error('Fehler beim Teilen der Note');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !channelRef.current) return;

    try {
      const userData = await blink.auth.me();
      
      await channelRef.current.publish('chat', {
        text: newMessage,
        timestamp: Date.now()
      }, {
        userId: userData.id,
        metadata: { email: userData.email }
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht');
    }
  };

  const copyClassroomCode = () => {
    navigator.clipboard.writeText(classroom.code);
    toast.success('Klassenzimmer-Code kopiert!');
  };

  const calculateClassroomStats = () => {
    if (sharedGrades.length === 0) return { avgGrade: 0, totalGrades: 0, subjects: 0 };

    const totalWeight = sharedGrades.reduce((sum, g) => sum + g.weight, 0);
    const weightedSum = sharedGrades.reduce((sum, g) => sum + (g.grade * g.weight), 0);
    const avgGrade = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const subjects = new Set(sharedGrades.map(g => g.subject)).size;

    return {
      avgGrade,
      totalGrades: sharedGrades.length,
      subjects
    };
  };

  const stats = calculateClassroomStats();

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{classroom.name}</h1>
              <p className="text-slate-600">{classroom.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                  {classroom.code}
                </code>
                <Button size="sm" variant="ghost" onClick={copyClassroomCode}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                {onlineUsers.length} online • {classroom.memberCount} Mitglieder
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Klassendurchschnitt</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.avgGrade > 0 ? stats.avgGrade.toFixed(2) : '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Basierend auf {stats.totalGrades} Noten
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Geteilte Noten</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGrades}</div>
                  <p className="text-xs text-muted-foreground">
                    In {stats.subjects} Fächern
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
                    {sharedGrades.length > 0 ? Math.min(...sharedGrades.map(g => g.grade)).toFixed(1) : '0.0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Klassenbeste
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Share Grade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Note teilen
                </CardTitle>
                <CardDescription>
                  Teilen Sie eine Ihrer Noten mit der Klasse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="gradeSelect">Note auswählen</Label>
                    <Select value={selectedGradeToShare} onValueChange={setSelectedGradeToShare}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie eine Note zum Teilen" />
                      </SelectTrigger>
                      <SelectContent>
                        {userGrades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.subject} - Note {grade.grade.toFixed(1)} ({grade.examType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={shareGrade} disabled={!selectedGradeToShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Teilen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shared Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Geteilte Noten
                </CardTitle>
                <CardDescription>
                  Noten, die von Klassenkameraden geteilt wurden
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sharedGrades.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Noten geteilt</p>
                    <p className="text-sm">Seien Sie der Erste, der eine Note teilt!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedGrades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-800">{grade.subject}</span>
                            <Badge 
                              variant={grade.grade <= 2 ? "default" : grade.grade <= 3 ? "secondary" : "destructive"}
                            >
                              {grade.grade.toFixed(1)}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              von {grade.userEmail}
                            </span>
                            <span className="text-sm text-slate-500">
                              {new Date(grade.sharedAt).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          {grade.notes && (
                            <p className="text-sm text-slate-600 mt-1">{grade.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Online Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Online ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div key={user.userId} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-700">{user.email}</span>
                    </div>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className="text-sm text-slate-500">Niemand online</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="flex flex-col h-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="text-sm">
                      <span className="font-medium text-slate-700">
                        {message.userEmail}:
                      </span>
                      <span className="ml-2 text-slate-600">{message.message}</span>
                      <div className="text-xs text-slate-400">
                        {new Date(message.timestamp).toLocaleTimeString('de-DE')}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nachricht eingeben..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}