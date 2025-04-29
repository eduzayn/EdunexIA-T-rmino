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
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/courses" component={CoursesPage} />
      <ProtectedRoute path="/courses/new" component={CourseCreatePage} />
      <ProtectedRoute path="/courses/:id/edit" component={CourseEditPage} />
      <ProtectedRoute path="/courses/:id" component={CourseDetailsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/:rest*">
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
