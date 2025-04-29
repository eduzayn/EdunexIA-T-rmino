import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Code, Youtube, Bot, LineChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CourseItem {
  id: number;
  title: string;
  studentsCount: number;
  price: number;
  rating: string;
  category: string;
}

interface PopularCoursesProps {
  courses: CourseItem[];
}

export function PopularCourses({ courses }: PopularCoursesProps) {
  const getCourseIcon = (category: string) => {
    switch (category) {
      case "development":
        return <Code className="text-primary h-5 w-5" />;
      case "marketing":
        return <Youtube className="text-red-600 h-5 w-5" />;
      case "ai":
        return <Bot className="text-purple-600 h-5 w-5" />;
      case "business":
        return <LineChart className="text-green-600 h-5 w-5" />;
      default:
        return <Code className="text-primary h-5 w-5" />;
    }
  };

  const getBgColor = (category: string) => {
    switch (category) {
      case "development":
        return "bg-primary-50 dark:bg-primary-900/20";
      case "marketing":
        return "bg-red-50 dark:bg-red-900/20";
      case "ai":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "business":
        return "bg-green-50 dark:bg-green-900/20";
      default:
        return "bg-primary-50 dark:bg-primary-900/20";
    }
  };

  const renderStars = (rating: string, courseId: number) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => {
          // Usar uma combinação de courseId, posição e tipo de estrela para garantir chaves únicas
          const position = i;
          const starType = i < fullStars ? 'full' : (i === fullStars && hasHalfStar ? 'half' : 'empty');
          const starKey = `star-${courseId}-${position}-${starType}`;
          
          return (
            <span key={starKey}>
              {i < fullStars ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              ) : i === fullStars && hasHalfStar ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Cursos Populares</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {courses.map((course, index) => (
            <li key={course.id} className="py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-md ${getBgColor(course.category)} flex items-center justify-center`}>
                    {getCourseIcon(course.category)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.studentsCount} alunos ativos</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium">{formatCurrency(course.price)}</span>
                  <div className="flex items-center mt-1">
                    {renderStars(course.rating, course.id)}
                    <span className="text-xs text-muted-foreground ml-1">{course.rating}</span>
                  </div>
                </div>
              </div>
              {index < courses.length - 1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
        <div className="mt-4 text-center">
          <a href="#" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
            Ver todos os cursos <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
