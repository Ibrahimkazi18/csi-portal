export interface User {
  id: string;
  name: string;
  email: string;
  role: 'core-team' | 'member';
  memberRole?: 'Designer' | 'Developer' | 'Manager' | 'Tester' | 'Marketing';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: 'core-team' | 'member') => Promise<void>;
  signup: (name: string, email: string, password: string, userType: 'core-team' | 'member') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface Team {
  id: string;
  name: string;
  leader: string;
  members: string[];
  points: number;
  rank: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  maxParticipants: number;
  deadline: string;
  type: 'individual' | 'team';
  status: 'active' | 'ended';
  registeredCount: number;
}

export interface Query {
  id: string;
  subject: string;
  message: string;
  memberName: string;
  memberEmail: string;
  status: 'Open' | 'Resolved';
  response?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface PendingMember {
  full_name: string;
  email: string;
  role: string;
  member_role: string;
  created_at: string;
}