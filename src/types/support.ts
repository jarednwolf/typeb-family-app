export interface SupportTicket {
  id: string;
  userId: string;
  familyId: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
  responses: SupportResponse[];
  attachments?: string[];
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: Date;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}

export interface SupportCategory {
  id: 'bug' | 'feature' | 'billing' | 'other';
  label: string;
  description: string;
  icon: string;
}

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Report an issue or problem',
    icon: 'alert-circle',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Suggest a new feature',
    icon: 'plus-circle',
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Questions about subscription or payment',
    icon: 'credit-card',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'General questions or feedback',
    icon: 'help-circle',
  },
];

export const FAQ_CATEGORIES = [
  'Getting Started',
  'Family Management',
  'Tasks & Chores',
  'Premium Features',
  'Billing & Subscription',
  'Technical Issues',
];