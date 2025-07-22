import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BookOpen, Info, Users, Trophy } from 'lucide-react';

const guideContent = [
  {
    id: 'participation',
    title: 'Event Participation',
    icon: Trophy,
    content: [
      'Register for events before deadlines',
      'Teams require exactly 4 members',
      'Individual events are open to all members',
      'Attend full duration of events'
    ]
  },
  {
    id: 'teams',
    title: 'Team Formation',
    icon: Users,
    content: [
      'One team registration per year',
      'Exactly 4 members required',
      'Changes allowed 48hrs before events',
      'Leader is primary contact'
    ]
  }
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-lavender">CSI Guide</h1>
      <div className="space-y-4">
        {guideContent.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="bg-dark-surface border-border">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        {section.title}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}