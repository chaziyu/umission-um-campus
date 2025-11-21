import { db, auth } from './firebase'; // Import auth
import { 
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, 
  query, where, increment, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { User, Event, Registration, UserRole, Feedback, Badge } from '../types';

// Keep LocalStorage for Session Persistence (Cache)
// This ensures your app still loads the user immediately on refresh
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
  // 1. Authenticate with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // 2. Fetch User Profile from Firestore (using the Auth UID)
  const userRef = doc(db, USERS_COL, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User profile not found. Please contact support.');
  }

  // 3. Construct User Object
  const userData = userSnap.data();
  const user = { id: uid, ...userData } as User;

  // 4. Cache in LocalStorage
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
  // 1. Create Auth Account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // 2. Create User Profile Object
  // Note: We don't store the password in Firestore anymore! Safe & Secure.
  const newUser = {
    name,
    email,
    role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
    bookmarks: []
  };

  // 3. Save to Firestore using the UID as the Document ID
  // This makes it easy to find the user later: db.collection('users').doc(uid)
  await setDoc(doc(db, USERS_COL, uid), newUser);
  
  // 4. Return and Cache
  const user = { id: uid, ...newUser } as User;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = async () => {
  await signOut(auth);
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  // We still rely on LocalStorage for instant UI state on refresh.
  // Ideally, you'd use onAuthStateChanged in App.tsx, but this preserves your existing architecture.
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
  // Firebase handles the email sending automatically now.
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

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    const updatedUser = { ...currentUser, bookmarks: newBookmarks };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  }
  
  return newBookmarks;
};

// --- Event Services ---

export const getEvents = async (): Promise<Event[]> => {
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

  // Check max quota
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
    status: 'pending',
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

  await updateDoc(regRef, { status });

  if (status === 'confirmed' && oldStatus !== 'confirmed') {
    await updateDoc(eventRef, { currentVolunteers: increment(1) });
  } else if (status === 'rejected' && oldStatus === 'confirmed') {
    await updateDoc(eventRef, { currentVolunteers: increment(-1) });
  }
};

export const getUserRegistrations = async (userId: string): Promise<Registration[]> => {
  const q = query(collection(db, REGS_COL), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const registrations = snapshot.docs.map(d => mapDoc<Registration>(d));

  const feedbacks = await getFeedbacks(userId);
  const events = await getEvents();

  return registrations.map(r => {
    const event = events.find(e => e.id === r.eventId);
    return {
      ...r,
      eventStatus: event ? event.status : 'upcoming',
      hasFeedback: !!feedbacks.find(f => f.eventId === r.eventId)
    };
  }).reverse();
};

// --- Badges Services ---

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const regs = await getUserRegistrations(userId);
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
