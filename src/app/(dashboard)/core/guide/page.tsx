import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, BookOpen, Info, AlertCircle, Users, Trophy } from 'lucide-react';

const guideContent = [
  {
    id: 'general-rules',
    title: 'General Rules',
    icon: Info,
    content: [
      'All CSI members must maintain academic integrity and ethical conduct.',
      'Respect for fellow members and constructive collaboration is mandatory.',
      'Regular participation in CSI activities is encouraged.',
      'Members must follow the college code of conduct at all times.',
      'Any violations should be reported to the core team immediately.'
    ]
  },
  {
    id: 'event-participation',
    title: 'Event Participation Guidelines',
    icon: Trophy,
    content: [
      'Register for events before the specified deadline.',
      'Team events require exactly 4 members unless specified otherwise.',
      'Individual events are open to all active CSI members.',
      'Late registrations will not be accepted under any circumstances.',
      'Participants must attend the entire duration of multi-day events.',
      'Plagiarism or cheating will result in immediate disqualification.'
    ]
  },
  {
    id: 'team-formation',
    title: 'Team Formation Rules',
    icon: Users,
    content: [
      'Teams can only be formed once per academic year.',
      'Each team must have exactly 4 members with one designated leader.',
      'Team changes are allowed up to 48 hours before event deadlines.',
      'Cross-year collaborations are encouraged and allowed.',
      'Teams should have diverse skill sets for better performance.',
      'Team leaders are responsible for communication with the core team.'
    ]
  },
  {
    id: 'point-system',
    title: 'Point System & Rewards',
    icon: Trophy,
    content: [
      'Points are awarded based on event performance and participation.',
      'Individual events: 1st place (100 pts), 2nd place (75 pts), 3rd place (50 pts).',
      'Team events: Points are distributed equally among team members.',
      'Bonus points may be awarded for exceptional innovation or creativity.',
      'Regular workshop attendance earns 10 points per session.',
      'Points reset at the beginning of each academic year.'
    ]
  },
  {
    id: 'code-of-conduct',
    title: 'Code of Conduct',
    icon: AlertCircle,
    content: [
      'Maintain professionalism in all CSI-related communications.',
      'Use appropriate language in all forums and discussions.',
      'Respect intellectual property and give proper attribution.',
      'Report any instances of harassment or inappropriate behavior.',
      'Collaborate openly and share knowledge with fellow members.',
      'Represent CSI positively in external events and competitions.'
    ]
  },
  {
    id: 'technical-guidelines',
    title: 'Technical Guidelines',
    icon: BookOpen,
    content: [
      'Use version control (Git) for all collaborative projects.',
      'Follow coding standards and best practices for your language.',
      'Document your code thoroughly for future reference.',
      'Test your applications before submission or presentation.',
      'Use open-source tools and libraries when possible.',
      'Share useful resources and tutorials with the community.'
    ]
  }
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">CSI Guide</h1>
          <p className="text-muted-foreground">Rules, guidelines, and frequently asked questions</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-5 w-5" />
          <span>Official Documentation</span>
        </div>
      </div>

      {/* Introduction */}
      <Card className="bg-dark-surface border-border glow-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Welcome to CSI
          </CardTitle>
          <CardDescription>
            Computer Science Institute - Building the future of technology together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            The Computer Science Institute (CSI) is dedicated to fostering a community of passionate 
            developers, designers, and technology enthusiasts. Our mission is to provide a platform 
            for learning, collaboration, and innovation while building lasting connections within 
            the tech community.
          </p>
        </CardContent>
      </Card>

      {/* Guide Sections */}
      <div className="space-y-4">
        {guideContent.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="bg-dark-surface border-border">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <ul className="space-y-3">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-foreground leading-relaxed">{item}</span>
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

      {/* Contact Information */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact the core team for any questions or concerns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">General Inquiries</h4>
              <p className="text-sm text-muted-foreground">csi@college.edu</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Technical Support</h4>
              <p className="text-sm text-muted-foreground">tech@csi.college.edu</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Event Registration</h4>
              <p className="text-sm text-muted-foreground">events@csi.college.edu</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Team Formation</h4>
              <p className="text-sm text-muted-foreground">teams@csi.college.edu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}