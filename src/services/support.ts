import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  arrayUnion,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SupportTicket, SupportResponse, FAQItem } from '../types/support';

export class SupportService {
  private ticketsCollection = collection(db, 'supportTickets');
  private faqCollection = collection(db, 'faq');

  async createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const newTicket = {
      ...ticket,
      userId: user.uid,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      responses: [],
    };

    const docRef = await addDoc(this.ticketsCollection, newTicket);
    
    // Send notification to support team if premium
    if (ticket.isPremium) {
      await this.notifySupportTeam(docRef.id, 'urgent');
    }
    
    return docRef.id;
  }

  async getMyTickets(): Promise<SupportTicket[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      this.ticketsCollection,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as SupportTicket));
  }

  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    const docRef = doc(this.ticketsCollection, ticketId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
    } as SupportTicket;
  }

  async addResponse(ticketId: string, message: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const response: SupportResponse = {
      id: doc(collection(db, 'temp')).id,
      ticketId,
      userId: user.uid,
      message,
      isStaff: false,
      createdAt: new Date(),
    };

    const ticketRef = doc(this.ticketsCollection, ticketId);
    await updateDoc(ticketRef, {
      responses: arrayUnion(response),
      updatedAt: serverTimestamp(),
      status: 'open', // Reopen if user responds
    });
  }

  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<void> {
    const ticketRef = doc(this.ticketsCollection, ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async getFAQs(category?: string): Promise<FAQItem[]> {
    let q = query(this.faqCollection, orderBy('helpful', 'desc'), limit(20));
    
    if (category) {
      q = query(this.faqCollection, where('category', '==', category), orderBy('helpful', 'desc'), limit(20));
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    } as FAQItem));
  }

  async searchFAQs(searchTerm: string): Promise<FAQItem[]> {
    // Note: This is a simple implementation. For production,
    // consider using a full-text search solution like Algolia
    const allFAQs = await this.getFAQs();
    const searchLower = searchTerm.toLowerCase();
    
    return allFAQs.filter(faq => 
      faq.question.toLowerCase().includes(searchLower) ||
      faq.answer.toLowerCase().includes(searchLower)
    );
  }

  async markFAQHelpful(faqId: string, helpful: boolean): Promise<void> {
    const field = helpful ? 'helpful' : 'notHelpful';
    const faqRef = doc(this.faqCollection, faqId);
    await updateDoc(faqRef, {
      [field]: increment(1),
    });
  }

  private async notifySupportTeam(ticketId: string, priority: string): Promise<void> {
    // This would integrate with your notification system
    // For premium users, send immediate notification to support team
    console.log(`Premium support ticket created: ${ticketId} with priority: ${priority}`);
    
    // In production, you might:
    // 1. Send push notification to support staff
    // 2. Send email to support team
    // 3. Create a task in your support management system
    // 4. Update a dashboard for real-time monitoring
  }

  async getEstimatedResponseTime(isPremium: boolean): Promise<string> {
    if (isPremium) {
      const now = new Date();
      const hour = now.getHours();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      
      // Business hours: 9 AM - 6 PM on weekdays
      if (!isWeekend && hour >= 9 && hour < 18) {
        return 'Within 2 hours';
      } else {
        return 'Within 2 hours (during business hours)';
      }
    }
    return '24-48 hours';
  }

  async initializeFAQs(): Promise<void> {
    // This method would be called once to populate initial FAQs
    const initialFAQs: Omit<FAQItem, 'id'>[] = [
      {
        question: 'How do I create a family?',
        answer: 'Go to the Family tab and tap "Create Family". Enter a family name and you\'ll receive an invite code to share with family members.',
        category: 'Getting Started',
        helpful: 0,
        notHelpful: 0,
      },
      {
        question: 'What are the benefits of Premium?',
        answer: 'Premium includes: unlimited family members, custom categories, photo validation, smart notifications, analytics dashboard, and priority support.',
        category: 'Premium Features',
        helpful: 0,
        notHelpful: 0,
      },
      {
        question: 'How do I assign tasks to family members?',
        answer: 'When creating a task, select the family member from the "Assign to" dropdown. They\'ll receive a notification about their new task.',
        category: 'Tasks & Chores',
        helpful: 0,
        notHelpful: 0,
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription anytime from Settings > Subscription. You\'ll continue to have access until the end of your billing period.',
        category: 'Billing & Subscription',
        helpful: 0,
        notHelpful: 0,
      },
      {
        question: 'How do photo validations work?',
        answer: 'Premium feature: When a task requires photo proof, the assigned member uploads a photo. Managers can then review and approve/reject from the validation queue.',
        category: 'Premium Features',
        helpful: 0,
        notHelpful: 0,
      },
    ];

    // Check if FAQs already exist
    const q = query(this.faqCollection, limit(1));
    const existing = await getDocs(q);
    if (existing.empty) {
      // Add initial FAQs
      const batch = writeBatch(db);
      initialFAQs.forEach(faq => {
        const docRef = doc(this.faqCollection);
        batch.set(docRef, faq);
      });
      await batch.commit();
    }
  }
}

export const supportService = new SupportService();