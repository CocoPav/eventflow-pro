import React from 'react';
import { Clock, AlertCircle, CheckCircle2, Flag, Tag, MapPin } from 'lucide-react';

export default function Badge({ status, label, icon: CustomIcon }) {
  const getStyles = () => {
    switch (status) {
      case 'success':
      case 'done':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', icon: CheckCircle2 };
      case 'warning':
      case 'todo':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', icon: AlertCircle };
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', icon: Flag };
      case 'medium':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', icon: Tag };
      case 'low':
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', icon: Clock };
      default:
        return { bg: '#f1f3f5', color: '#64748b', icon: Tag };
    }
  };

  const { bg, color, icon: Icon } = getStyles();
  const FinalIcon = CustomIcon || Icon;

  return (
    <span style={{ 
      background: bg, 
      color: color, 
      padding: '4px 12px', 
      borderRadius: 'var(--radius-full)', 
      fontSize: '0.7rem', 
      fontWeight: 700, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '6px',
      border: `1px solid ${bg}`
    }}>
      <FinalIcon size={12} strokeWidth={3} />
      {label}
    </span>
  );
}
