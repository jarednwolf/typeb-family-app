'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, User, Family } from '@typeb/types';
import { authAdapter } from '@/lib/firebase/auth-adapter';

export default function NewTaskPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium' as Task['priority'],
    category: '',
    points: 10,
    requiresPhoto: false,
    isRecurring: false,
    reminderEnabled: false,
    reminderTime: '09:00',
  });

  useEffect(() => {
    loadUserAndFamily();
  }, []);

  const loadUserAndFamily = async () => {
    try {
      const currentUser = await authAdapter.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);
      setFormData(prev => ({ ...prev, assignedTo: currentUser.id }));

      if (currentUser.familyId) {
        // Load family
        const familyQuery = query(
          collection(db, 'families'),
          where('__name__', '==', currentUser.familyId)
        );
        const familySnapshot = await getDocs(familyQuery);
        if (!familySnapshot.empty) {
          const familyData = {
            id: familySnapshot.docs[0].id,
            ...familySnapshot.docs[0].data()
          } as Family;
          setFamily(familyData);
        }

        // Load family members
        const membersQuery = query(
          collection(db, 'users'),
          where('familyId', '==', currentUser.familyId)
        );
        const membersSnapshot = await getDocs(membersQuery);
        const members = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setFamilyMembers(members);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!user?.familyId) {
      setError('You must be part of a family to create tasks');
      setIsLoading(false);
      return;
    }

    try {
      // Get category with proper TaskCategory type
      let category: Task['category'] = {
        id: '1',
        name: 'General',
        color: '#6B7280',
        icon: 'clipboard',
        order: 0
      };
      
      if (formData.category && family?.taskCategories) {
        const selectedCategory = family.taskCategories.find(c => c.id === formData.category);
        if (selectedCategory) {
          category = {
            ...selectedCategory,
            icon: selectedCategory.icon || 'clipboard',
            order: selectedCategory.order || 0
          };
        }
      }

      const newTask: Omit<Task, 'id'> = {
        familyId: user.familyId,
        title: formData.title,
        description: formData.description,
        category,
        assignedTo: formData.assignedTo,
        assignedBy: user.id,
        createdBy: user.id,
        status: 'pending',
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : new Date(),
        points: formData.points,
        requiresPhoto: formData.requiresPhoto,
        isRecurring: formData.isRecurring,
        reminderEnabled: formData.reminderEnabled,
        reminderTime: formData.reminderTime,
        escalationLevel: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'tasks'), newTask);
      router.push('/dashboard/tasks');
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="e.g., Clean the kitchen"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Add more details about the task..."
            />
          </div>

          {/* Assign To */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.displayName} {member.id === user?.id && '(You)'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            {family?.taskCategories && family.taskCategories.length > 0 && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {family.taskCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Points */}
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                id="points"
                name="points"
                type="number"
                value={formData.points}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiresPhoto"
                checked={formData.requiresPhoto}
                onChange={handleChange}
                className="rounded border-gray-300 text-black focus:ring-black mr-2"
              />
              <span className="text-sm text-gray-700">Requires photo validation</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="rounded border-gray-300 text-black focus:ring-black mr-2"
              />
              <span className="text-sm text-gray-700">Make this a recurring task</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="reminderEnabled"
                checked={formData.reminderEnabled}
                onChange={handleChange}
                className="rounded border-gray-300 text-black focus:ring-black mr-2"
              />
              <span className="text-sm text-gray-700">Enable reminders</span>
            </label>
          </div>

          {/* Reminder Time */}
          {formData.reminderEnabled && (
            <div>
              <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Time
              </label>
              <input
                id="reminderTime"
                name="reminderTime"
                type="time"
                value={formData.reminderTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/tasks')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}