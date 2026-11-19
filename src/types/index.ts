export type UserRole = 'APPRENTICE' | 'MENTOR';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bio?: string;
  interests: string[];
  skills: string[];
  area?: string;
  photoURL?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  apprenticeId: string;
  mentorId: string;
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  matchId: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  learningPathId: string;
  title: string;
  description: string;
  order: number;
  active: boolean;
  videoUrl?: string;
}

export interface Progress {
  id: string;
  userId: string;
  learningPathId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
}
