import React from 'react';
import { Badge } from './Badge';
import {
  EnrollmentStatus,
  PaymentStatus,
  AssignmentStatus,
  ProjectStatus,
  ExamStatus,
  AttendanceStatus,
  FeedbackStatus,
} from '../../types/database';

interface StatusBadgeProps {
  status:
    | EnrollmentStatus
    | PaymentStatus
    | AssignmentStatus
    | ProjectStatus
    | ExamStatus
    | AttendanceStatus
    | FeedbackStatus
    | string;
  type?: 'enrollment' | 'payment' | 'assignment' | 'project' | 'exam' | 'attendance' | 'feedback' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace(/_/g, ' ');

  // Determine variant and human readable label
  let variant: 'default' | 'brand' | 'success' | 'warning' | 'destructive' | 'outline' = 'default';

  switch (status) {
    case 'approved':
    case 'verified':
    case 'evaluated':
    case 'present':
    case 'resolved':
    case 'replied':
      variant = 'success';
      break;

    case 'instructor':
      variant = 'brand';
      break;

    case 'payment_pending':
    case 'payment_verification_pending':
    case 'pending':
    case 'under_review':
    case 'in_progress':
    case 'open':
      variant = 'warning';
      break;

    case 'rejected':
    case 'suspended':
    case 'absent':
    case 'late':
    case 'timed_out':
      variant = 'destructive';
      break;

    case 'registered':
    case 'submitted':
    case 'excused':
      variant = 'brand';
      break;

    default:
      variant = 'default';
      break;
  }

  return (
    <Badge variant={variant} className="capitalize font-medium text-xs tracking-normal">
      {normalized}
    </Badge>
  );
};
