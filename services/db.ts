import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  query, where, increment, arrayUnion, arrayRemove, 
  Timestamp, orderBy
} from 'firebase/firestore';
import { User, Event, Registration, UserRole, Feedback, Badge } from '../types';

// Keep LocalStorage for Session Management ONLY
const CURRENT_USER_KEY = 'um_current_user';

// Collections
const USERS_COL = 'users';
const EVENTS_COL = 'events';
const REGS_COL = 'registrations';
const FEEDBACKS_COL = 'feedbacks';

// Helper to convert Firestore doc to typed object
const mapDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() });

// --- Auth Services ---

export const login = async (email: string, password: string): Promise<User> => {
  const q = query(
    collection(db, USERS_COL), 
    where('email', '==', email), 
    where('password', '==', password)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('Invalid Email or Password');
  }

  const userDoc = snapshot.docs[0];
  // Exclude password from session object
  const { password: _, ...safeUser } = userDoc.data();
  const user = { id: userDoc.id, ...safeUser } as User;

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
  // Check if email exists
  const q = query(collection(db, USERS_COL), where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Siswa Mail/Email already registered');
  }

  const newUser = {
    name,
    email,
    password, // Prototype: Storing password in plain text as requested
    role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&background=10b981`,
    bookmarks: []
  };

  const docRef = await addDoc(collection(db, USERS_COL), newUser);
  
  // Return safe user object
  const { password: _, ...safeData } = newUser;
  const safeUser = { id: docRef.id, ...safeData } as User;
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  return safeUser;
};

export const logout = async () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  // Check if user exists
  const q = query(collection(db, USERS_COL), where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('No account found with this email address.');
  }

  console.log(`[Mock Email Service] Sending password reset link to ${email}`);
  return;
};

export const toggleBookmark = async (userId: string, eventId: string): Promise<string[]> => {
  const userRef = doc(db, USERS_COL, userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) throw new Error('User not found');
  
  const userData = userSnap.data();
  const bookmarks = userData.bookmarks || [];
  
  let newBookmarks: string[];

  if (bookmarks.includes(eventId)) {
    await updateDoc(userRef, {
      bookmarks: arrayRemove(eventId)
    });
    newBookmarks = bookmarks.filter((id: string) => id !== eventId);
  } else {
    await updateDoc(userRef, {
      bookmarks: arrayUnion(eventId)
    });
    newBookmarks = [...bookmarks, eventId];
  }

  // Update local session if current user matches
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    const updatedUser = { ...currentUser, bookmarks: newBookmarks };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  }
  
  return newBookmarks;
};

// --- Event Services ---

export const getEvents = async (): Promise<Event[]> => {
  // Order by date? Firestore doesn't default sort.
  // For now just fetch all.
  const snapshot = await getDocs(collection(db, EVENTS_COL));
  return snapshot.docs.map(d => mapDoc<Event>(d));
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'currentVolunteers' | 'status'>): Promise<Event> => {
  const newEvent = {
    ...eventData,
    currentVolunteers: 0,
    status: 'upcoming',
    imageUrl: eventData.imageUrl || `https://picsum.photos/400/200?random=${Date.now()}`
  };

  const docRef = await addDoc(collection(db, EVENTS_COL), newEvent);
  return { id: docRef.id, ...newEvent } as Event;
};

export const updateEventStatus = async (eventId: string, status: 'upcoming' | 'completed'): Promise<void> => {
  const eventRef = doc(db, EVENTS_COL, eventId);
  await updateDoc(eventRef, { status });
};

export const getOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  const q = query(collection(db, EVENTS_COL), where('organizerId', '==', organizerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDoc<Event>(d));
};

// --- Registration Services ---

export const joinEvent = async (eventId: string, userId: string): Promise<Registration> => {
  const eventRef = doc(db, EVENTS_COL, eventId);
  const eventSnap = await getDoc(eventRef);
  
  if (!eventSnap.exists()) throw new Error('Event not found');
  const eventData = eventSnap.data() as Event;

  // Check existing registration
  const q = query(
    collection(db, REGS_COL), 
    where('eventId', '==', eventId), 
    where('userId', '==', userId)
  );
  const existingReg = await getDocs(q);
  if (!existingReg.empty) {
    throw new Error('You have already requested to join this event');
  }

  // Check max quota based on CONFIRMED participants
  const qConfirmed = query(
    collection(db, REGS_COL), 
    where('eventId', '==', eventId), 
    where('status', '==', 'confirmed')
  );
  const confirmedSnap = await getDocs(qConfirmed);
  
  if (confirmedSnap.size >= eventData.maxVolunteers) {
    throw new Error('Event quota is full');
  }

  const currentUser = getCurrentUser();

  const newRegData = {
    eventId,
    userId,
    userName: currentUser?.name || 'Volunteer',
    userAvatar: currentUser?.avatar,
    joinedAt: new Date().toISOString(),
    status: 'pending', // Default to pending
    eventTitle: eventData.title,
    eventDate: eventData.date,
    eventStatus: eventData.status
  };

  const docRef = await addDoc(collection(db, REGS_COL), newRegData);
  return { id: docRef.id, ...newRegData } as Registration;
};

export const getEventRegistrations = async (eventId: string): Promise<Registration[]> => {
  const q = query(collection(db, REGS_COL), where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDoc<Registration>(d));
};

export const updateRegistrationStatus = async (registrationId: string, status: 'confirmed' | 'rejected'): Promise<void> => {
  const regRef = doc(db, REGS_COL, registrationId);
  const regSnap = await getDoc(regRef);
  
  if (!regSnap.exists()) return;
  
  const regData = regSnap.data();
  const oldStatus = regData.status;
  const eventId = regData.eventId;
  const eventRef = doc(db, EVENTS_COL, eventId);

  // Update status
  await updateDoc(regRef, { status });

  // Update Event Counter
  if (status === 'confirmed' && oldStatus !== 'confirmed') {
    await updateDoc(eventRef, { currentVolunteers: increment(1) });
  } else if (status === 'rejected' && oldStatus === 'confirmed') {
    await updateDoc(eventRef, { currentVolunteers: increment(-1) });
  }
};

export const getUserRegistrations = async (userId: string): Promise<Registration[]> => {
  // Get registrations
  const q = query(collection(db, REGS_COL), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const registrations = snapshot.docs.map(d => mapDoc<Registration>(d));

  // Get feedbacks to check 'hasFeedback'
  const feedbacks = await getFeedbacks(userId);
  
  // We need to fetch current event status because the snapshot in Registration might be stale
  // Optimization: Fetch all events? Or fetch individually? 
  // For simplicity in this refactor, let's fetch all events map them.
  const events = await getEvents();

  return registrations.map(r => {
    const event = events.find(e => e.id === r.eventId);
    return {
      ...r,
      eventStatus: event ? event.status : 'upcoming',
      hasFeedback: !!feedbacks.find(f => f.eventId === r.eventId)
    };
  }).reverse(); // Recent first
};

// --- Badges Services ---

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  // This logic remains client-side calculation based on fetched history
  const regs = await getUserRegistrations(userId);
  
  // Filter locally
  const completed = regs.filter(r => r.status === 'confirmed' && r.eventStatus === 'completed');
  
  const badges: Badge[] = [];

  if (completed.length >= 1) {
    badges.push({
      id: 'b_1',
      name: 'First Step',
      icon: '🌱',
      description: 'Joined your first UM event',
      color: 'bg-green-100 text-green-800'
    });
  }

  const kkEvents = completed.filter(r => 
    (r.eventTitle || '').includes('KK') || (r.eventTitle || '').includes('College')
  );
  if (kkEvents.length >= 1) {
    badges.push({
      id: 'b_2',
      name: 'KK Spirit',
      icon: '🏠',
      description: 'Active in Residential Colleges',
      color: 'bg-blue-100 text-blue-800'
    });
  }

  const ecoEvents = completed.filter(r => {
    const t = (r.eventTitle || '').toLowerCase();
    return t.includes('tree') || t.includes('tasik') || t.includes('clean') || t.includes('environment');
  });
  
  if (ecoEvents.length >= 1) {
    badges.push({
      id: 'b_3',
      name: 'Eco Warrior',
      icon: '♻️',
      description: 'Helping UM go Green',
      color: 'bg-emerald-100 text-emerald-800'
    });
  }

  return badges;
};

// --- Feedback Services ---

export const submitFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> => {
  const newFeedback = {
    ...feedback,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, FEEDBACKS_COL), newFeedback);
  return { id: docRef.id, ...newFeedback } as Feedback;
};

export const getFeedbacks = async (userId?: string, eventId?: string): Promise<Feedback[]> => {
  let q = query(collection(db, FEEDBACKS_COL));
  
  if (userId) {
    q = query(q, where('userId', '==', userId));
  }
  if (eventId) {
    q = query(q, where('eventId', '==', eventId));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDoc<Feedback>(d));
};

export const getEventAverageRating = async (eventId: string): Promise<number> => {
  const feedbacks = await getFeedbacks(undefined, eventId);
  if (feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
  return Number((sum / feedbacks.length).toFixed(1));
};