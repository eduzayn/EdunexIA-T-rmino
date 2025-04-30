import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import CoursesPage from "@/pages/courses-page";
import CourseDetailsPage from "@/pages/course-details-page";
import CourseCreatePage from "@/pages/course-create-page";
import CourseEditPage from "@/pages/course-edit-page";
import ModuleCreatePage from "@/pages/module-create-page";
import ModuleEditPage from "@/pages/module-edit-page";
import { SubjectsPage } from "@/pages/subjects-page";
import { SubjectCreatePage } from "@/pages/subject-create-page";
import { SubjectEditPage } from "@/pages/subject-edit-page";
import { SubjectDetailsPage } from "@/pages/subject-details-page";
import { ClassesPage } from "@/pages/classes-page";
import { ClassCreatePage } from "@/pages/class-create-page";
import { ClassEditPage } from "@/pages/class-edit-page";
import { ClassDetailsPage } from "@/pages/class-details-page";
import { ProtectedRoute } from "./lib/protected-route";
import { PortalProvider, usePortal } from "./hooks/use-portal";

function Router() {
  const { currentPortal } = usePortal();
  const baseRoute = currentPortal.baseRoute;
  
  return (
    <Switch>
      {/* Rotas comuns a todos os portais */}
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas do Portal Administrativo */}
      <ProtectedRoute path="/admin/courses" component={CoursesPage} />
      <ProtectedRoute path="/admin/courses/new" component={CourseCreatePage} />
      <ProtectedRoute path="/admin/courses/:id/edit" component={CourseEditPage} />
      <ProtectedRoute path="/admin/courses/:id/modules/new" component={ModuleCreatePage} />
      <ProtectedRoute path="/admin/courses/:courseId/modules/:moduleId/edit" component={ModuleEditPage} />
      <ProtectedRoute path="/admin/courses/:id" component={CourseDetailsPage} />
      
      {/* Rotas de Disciplinas */}
      <ProtectedRoute path="/admin/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/admin/subjects/new" component={SubjectCreatePage} />
      <ProtectedRoute path="/admin/subjects/:id/edit" component={SubjectEditPage} />
      <ProtectedRoute path="/admin/subjects/:id" component={SubjectDetailsPage} />
      
      {/* Rotas de Turmas */}
      <ProtectedRoute path="/admin/classes" component={ClassesPage} />
      <ProtectedRoute path="/admin/classes/new" component={ClassCreatePage} />
      <ProtectedRoute path="/admin/classes/:id/edit" component={ClassEditPage} />
      <ProtectedRoute path="/admin/classes/:id" component={ClassDetailsPage} />
      
      {/* Rotas do Portal do Aluno */}
      <ProtectedRoute path="/student/courses" component={CoursesPage} />
      <ProtectedRoute path="/student/courses/:id" component={CourseDetailsPage} />
      
      {/* Rotas do Portal do Professor */}
      <ProtectedRoute path="/teacher/courses" component={CoursesPage} />
      <ProtectedRoute path="/teacher/courses/:id" component={CourseDetailsPage} />
      <ProtectedRoute path="/teacher/courses/:id/edit" component={CourseEditPage} />
      
      {/* Rotas do Portal do Polo */}
      <ProtectedRoute path="/hub/courses" component={CoursesPage} />
      
      {/* Rotas do Portal do Parceiro */}
      <ProtectedRoute path="/partner/courses" component={CoursesPage} />
      
      {/* Rota para página não encontrada */}
      <Route path="/:rest*">
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function AppWithProviders() {
  return (
    <PortalProvider>
      <Router />
    </PortalProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AppWithProviders />
    </TooltipProvider>
  );
}

export default App;
