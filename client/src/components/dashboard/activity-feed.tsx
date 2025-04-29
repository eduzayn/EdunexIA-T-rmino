import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, ArrowRight } from "lucide-react";

interface ActivityItem {
  id: number;
  user: {
    name: string;
    avatarUrl: string | null;
  };
  action: string;
  time: string;
  badge: string;
  badgeColor: "green" | "blue" | "purple" | "yellow" | "red";
  secondaryBadge?: string;
  secondaryBadgeColor?: "green" | "blue" | "purple" | "yellow" | "red";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getBadgeVariant = (color: string) => {
    switch (color) {
      case "green": return "success";
      case "blue": return "info";
      case "purple": return "purple";
      case "yellow": return "warning";
      case "red": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="py-2">
              <div className="flex space-x-3">
                {activity.user.avatarUrl ? (
                  <Avatar>
                    <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {activity.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{activity.user.name}</h3>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                  <div className="flex items-center space-x-2 pt-1">
                    <Badge variant={getBadgeVariant(activity.badgeColor) as any}>
                      {activity.badge}
                    </Badge>
                    {activity.secondaryBadge && (
                      <Badge variant={getBadgeVariant(activity.secondaryBadgeColor!) as any}>
                        {activity.secondaryBadge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {activities.indexOf(activity) < activities.length - 1 && (
                <Separator className="mt-4" />
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 text-center">
          <a href="#" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
            Ver todas as atividades <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
