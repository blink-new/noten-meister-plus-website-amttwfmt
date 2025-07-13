import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { blink } from '../lib/blink';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Copy, 
  UserPlus, 
  Settings, 
  LogOut,
  BookOpen,
  Trophy,
  Clock
} from 'lucide-react';

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

interface ClassroomManagerProps {
  onClassroomSelect: (classroom: Classroom) => void;
}

export function ClassroomManager({ onClassroomSelect }: ClassroomManagerProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    description: ''
  });
  const [joinCode, setJoinCode] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadClassrooms();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await blink.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadClassrooms = async () => {
    try {
      const userData = await blink.auth.me();
      
      // Get classrooms where user is a member
      const membershipData = await blink.db.classroomMembers.list({
        where: { userId: userData.id }
      });

      const classroomIds = membershipData.map((m: any) => m.classroomId);
      
      if (classroomIds.length === 0) {
        setClassrooms([]);
        return;
      }

      // Get classroom details
      const classroomPromises = classroomIds.map(async (id: string) => {
        const classroomData = await blink.db.classrooms.list({
          where: { id: id }
        });
        
        if (classroomData.length > 0) {
          const classroom = classroomData[0];
          
          // Get member count
          const members = await blink.db.classroomMembers.list({
            where: { classroomId: id }
          });
          
          // Get user's role
          const userMembership = membershipData.find((m: any) => m.classroomId === id);
          
          return {
            id: classroom.id,
            name: classroom.name,
            description: classroom.description,
            code: classroom.code,
            createdBy: classroom.created_by,
            createdAt: classroom.created_at,
            isActive: Number(classroom.is_active) > 0,
            memberCount: members.length,
            role: userMembership?.role || 'member'
          };
        }
        return null;
      });

      const classroomResults = await Promise.all(classroomPromises);
      setClassrooms(classroomResults.filter(c => c !== null) as Classroom[]);
    } catch (error) {
      console.error('Error loading classrooms:', error);
      toast.error('Fehler beim Laden der Klassenzimmer');
    }
  };

  const generateClassroomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createClassroom = async () => {
    if (!newClassroom.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const userData = await blink.auth.me();
      const code = generateClassroomCode();
      
      // Create classroom
      const classroom = await blink.db.classrooms.create({
        name: newClassroom.name,
        description: newClassroom.description,
        code: code,
        createdBy: userData.id,
        isActive: 1
      });

      // Add creator as admin member
      await blink.db.classroomMembers.create({
        classroomId: classroom.id,
        userId: userData.id,
        role: 'admin'
      });

      toast.success('Klassenzimmer erstellt!');
      setIsCreateDialogOpen(false);
      setNewClassroom({ name: '', description: '' });
      loadClassrooms();
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error('Fehler beim Erstellen des Klassenzimmers');
    }
  };

  const joinClassroom = async () => {
    if (!joinCode.trim()) {
      toast.error('Bitte geben Sie einen Code ein');
      return;
    }

    try {
      const userData = await blink.auth.me();
      
      // Find classroom by code
      const classroomData = await blink.db.classrooms.list({
        where: { code: joinCode.toUpperCase() }
      });

      if (classroomData.length === 0) {
        toast.error('Klassenzimmer nicht gefunden');
        return;
      }

      const classroom = classroomData[0];

      // Check if already a member
      const existingMembership = await blink.db.classroomMembers.list({
        where: { 
          AND: [
            { classroomId: classroom.id },
            { userId: userData.id }
          ]
        }
      });

      if (existingMembership.length > 0) {
        toast.error('Sie sind bereits Mitglied dieses Klassenzimmers');
        return;
      }

      // Add as member
      await blink.db.classroomMembers.create({
        classroomId: classroom.id,
        userId: userData.id,
        role: 'member'
      });

      toast.success(`Erfolgreich dem Klassenzimmer "${classroom.name}" beigetreten!`);
      setIsJoinDialogOpen(false);
      setJoinCode('');
      loadClassrooms();
    } catch (error) {
      console.error('Error joining classroom:', error);
      toast.error('Fehler beim Beitreten zum Klassenzimmer');
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code kopiert!');
  };

  const leaveClassroom = async (classroomId: string) => {
    try {
      const userData = await blink.auth.me();
      
      // Remove membership
      const membership = await blink.db.classroomMembers.list({
        where: { 
          AND: [
            { classroomId: classroomId },
            { userId: userData.id }
          ]
        }
      });

      if (membership.length > 0) {
        await blink.db.classroomMembers.delete(membership[0].id);
        toast.success('Klassenzimmer verlassen');
        loadClassrooms();
      }
    } catch (error) {
      console.error('Error leaving classroom:', error);
      toast.error('Fehler beim Verlassen des Klassenzimmers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Klassenzimmer</h2>
          <p className="text-slate-600">Teilen Sie Ihre Noten mit Freunden und Klassenkameraden</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Beitreten
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Klassenzimmer beitreten</DialogTitle>
                <DialogDescription>
                  Geben Sie den Code ein, den Sie von einem Klassenkameraden erhalten haben
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Klassenzimmer-Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="z.B. ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={joinClassroom} className="flex-1">
                    Beitreten
                  </Button>
                  <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Klassenzimmer erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie ein Klassenzimmer und laden Sie Ihre Freunde ein
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Mathematik 12a"
                    value={newClassroom.name}
                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <Input
                    id="description"
                    placeholder="z.B. Für unsere Mathe-Lerngruppe"
                    value={newClassroom.description}
                    onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createClassroom} className="flex-1">
                    Erstellen
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Noch keine Klassenzimmer</h3>
            <p className="text-slate-600 mb-4">
              Erstellen Sie Ihr erstes Klassenzimmer oder treten Sie einem bestehenden bei
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erstellen
              </Button>
              <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Beitreten
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <Card key={classroom.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                    {classroom.description && (
                      <CardDescription className="mt-1">
                        {classroom.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={classroom.role === 'admin' ? 'default' : 'secondary'}>
                    {classroom.role === 'admin' ? 'Admin' : 'Mitglied'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {classroom.memberCount} Mitglieder
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(classroom.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                      {classroom.code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyClassroomCode(classroom.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onClassroomSelect(classroom)}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Öffnen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => leaveClassroom(classroom.id)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}