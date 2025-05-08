
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, User } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowLeft, 
  Check, 
  X, 
  Edit, 
  Trash, 
  UserPlus, 
  Shield, 
  ShieldOff,
  Filter
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'pending' | 'blocked'>('active');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) throw authError;
        
        if (!session) {
          navigate('/auth');
          return;
        }
        
        // Verificar si el usuario es administrador
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (userError) throw userError;
        
        if (!userData || !userData.is_admin) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para acceder al panel de administración.",
            variant: "destructive",
          });
          navigate('/chat');
          return;
        }
        
        setIsAdmin(true);
        loadUsers();
      } catch (error) {
        console.error('Error verificando permisos:', error);
        toast({
          title: "Error",
          description: "No se pudo verificar tus permisos. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };
    
    checkAdmin();
  }, [navigate, toast]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'pending' | 'blocked') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Actualizar la lista de usuarios
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      toast({
        title: "Estado actualizado",
        description: `El usuario ha sido ${
          newStatus === 'active' ? 'activado' : 
          newStatus === 'blocked' ? 'bloqueado' : 
          'marcado como pendiente'
        }.`,
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario.",
        variant: "destructive",
      });
    }
  };

  const handleAdminToggle = async (userId: string, makeAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: makeAdmin })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Actualizar la lista de usuarios
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_admin: makeAdmin } : user
      ));
      
      toast({
        title: "Permisos actualizados",
        description: `Los permisos de administrador han sido ${makeAdmin ? 'concedidos' : 'revocados'}.`,
      });
    } catch (error) {
      console.error('Error actualizando permisos:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar los permisos del usuario.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Primero eliminar los mensajes relacionados
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId);
        
      if (messagesError) throw messagesError;
      
      // Luego eliminar los chats
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('user_id', userId);
        
      if (chatsError) throw chatsError;
      
      // Finalmente eliminar el usuario
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (userError) throw userError;
      
      // Actualizar la lista de usuarios
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente junto con todos sus datos.",
      });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    // Fix type issue by ensuring we only set valid status values
    setEditStatus(
      user.status === 'active' || user.status === 'pending' || user.status === 'blocked' 
        ? user.status 
        : 'active'
    );
    setEditIsAdmin(user.is_admin);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: editUsername,
          email: editEmail,
          status: editStatus,
          is_admin: editIsAdmin
        })
        .eq('id', editUser.id);
        
      if (error) throw error;
      
      // Actualizar la lista de usuarios
      setUsers(prev => prev.map(user => 
        user.id === editUser.id ? { 
          ...user, 
          username: editUsername,
          email: editEmail,
          status: editStatus,
          is_admin: editIsAdmin
        } : user
      ));
      
      setShowEditDialog(false);
      toast({
        title: "Usuario actualizado",
        description: "La información del usuario ha sido actualizada exitosamente.",
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del usuario.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/chat')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los usuarios de la aplicación, sus permisos y estados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter || 'Todos los estados'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    Todos los estados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Activos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    Pendientes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('blocked')}>
                    Bloqueados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" onClick={loadUsers}>
                Actualizar
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md">
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        {searchQuery || statusFilter ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === 'active' ? 'default' :
                              user.status === 'pending' ? 'outline' :
                              'destructive'
                            }
                          >
                            {user.status === 'active' ? 'Activo' :
                             user.status === 'pending' ? 'Pendiente' :
                             'Bloqueado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? 'secondary' : 'outline'}>
                            {user.is_admin ? 'Administrador' : 'Usuario'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {user.status !== 'active' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleStatusChange(user.id, 'active')}
                                title="Activar"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            
                            {user.status !== 'blocked' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleStatusChange(user.id, 'blocked')}
                                title="Bloquear"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            
                            {!user.is_admin ? (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleAdminToggle(user.id, true)}
                                title="Hacer administrador"
                              >
                                <Shield className="h-4 w-4 text-blue-500" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleAdminToggle(user.id, false)}
                                title="Quitar permisos de administrador"
                              >
                                <ShieldOff className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Eliminar"
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuario
              </Label>
              <Input
                id="username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo
              </Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <div className="col-span-3">
                <select
                  id="status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isAdmin" className="text-right">
                Administrador
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isAdmin" className="ml-2 text-sm">
                  Este usuario es administrador
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
