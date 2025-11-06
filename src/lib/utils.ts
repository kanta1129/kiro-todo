import { clsx, type ClassValue } from 'clsx';

// Utility function for combining class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date utility functions for freshness calculations
export function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  
  // Reset time to start of day for accurate day calculation
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getHoursUntilDue(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  
  const diffTime = due.getTime() - now.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  
  return diffHours;
}

export function isOverdue(dueDate: Date): boolean {
  return getDaysUntilDue(dueDate) < 0;
}

export function formatDaysUntilDue(daysUntilDue: number): string {
  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
  } else if (daysUntilDue === 0) {
    return 'Due today';
  } else if (daysUntilDue === 1) {
    return 'Due tomorrow';
  } else {
    return `${daysUntilDue} days remaining`;
  }
}