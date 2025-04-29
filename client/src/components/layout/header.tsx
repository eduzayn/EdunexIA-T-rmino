import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  User,
  Sun
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-30">
      <div className="max-w-[2000px] mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo Area */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground h-10 w-10"
              onClick={onToggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <Link href="/" className="flex items-center space-x-3 lg:hidden">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground tracking-wider ml-1 mb-0.5">NEXTGEN</span>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-primary to-purple-600 rounded-md">
                    <span className="text-white font-bold text-lg">E</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-foreground">Edunéx<span className="text-primary font-black">IA</span></span>
                </div>
              </div>
            </Link>
            
          </div>
          
          {/* Search Bar - Hidden on Mobile */}
          <div className={`${showMobileSearch ? 'flex absolute left-0 right-0 top-0 bg-background p-4 h-20 z-50' : 'hidden'} lg:relative lg:flex lg:p-0 lg:h-auto lg:z-auto lg:flex-1 lg:max-w-xl lg:ml-8`}>
            {showMobileSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 lg:hidden h-10 w-10"
                onClick={() => setShowMobileSearch(false)}
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            )}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input 
                type="search" 
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background/70 text-base" 
                placeholder="Pesquisar cursos, alunos ou recursos..." 
              />
            </div>
          </div>
          
          {/* Right Side Nav Items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10"
              onClick={() => setShowMobileSearch(true)}
              aria-label="Pesquisar"
            >
              <Search className="h-6 w-6 text-muted-foreground" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10"
              aria-label="Notificações"
            >
              <Bell className="h-6 w-6 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label="Ajuda"
            >
              <HelpCircle className="h-6 w-6 text-muted-foreground" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? (
                <Sun className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Moon className="h-6 w-6 text-muted-foreground" />
              )}
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 flex items-center gap-3 pl-0">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-base">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-base font-medium leading-tight">{user?.fullName}</span>
                    <span className="text-sm text-muted-foreground leading-tight">{user?.role === 'admin' ? 'Administrador' : user?.role === 'teacher' ? 'Professor' : 'Aluno'}</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-base font-medium">{user?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground">Instituição atual</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-md bg-secondary-100 flex items-center justify-center">
                          <span className="text-secondary-800 text-sm font-bold">
                            {user?.tenantId === 1 ? 'ED' : 'TS'}
                          </span>
                        </div>
                        <span className="text-base font-medium">
                          {user?.tenantId === 1 ? 'Edunéxia Demo' : 'Tenant Secundário'}
                        </span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="py-2.5 text-base">
                    <User className="mr-3 h-5 w-5" />
                    <span>Meu perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5 text-base">
                    <Settings className="mr-3 h-5 w-5" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive py-2.5 text-base" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
