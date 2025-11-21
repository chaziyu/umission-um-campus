
export enum UserRole {
  VOLUNTEER = 'volunteer',
  ORGANIZER = 'organizer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bookmarks?: string[]; // List of Event IDs
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  maxVolunteers: number;
  description: string;
  tasks: string; 
  organizerId: string;
  organizerName: string;
  currentVolunteers: number;
  imageUrl?: string;
  status: 'upcoming' | 'completed';
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName?: string; // For organizer to see who applied
  userAvatar?: string;
  joinedAt: string;
  status: 'pending' | 'confirmed' | 'rejected'; // Updated status
  eventTitle?: string;
  eventDate?: string;
  eventStatus?: 'upcoming' | 'completed';
  hasFeedback?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
