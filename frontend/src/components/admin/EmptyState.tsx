import { AlertCircle, Database, Users } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  type: 'no-data' | 'no-users' | 'error';
  message?: string;
  onRetry?: () => void;
}

export default function EmptyState({ type, message, onRetry }: EmptyStateProps) {
  const config = {
    'no-data': {
      icon: <Database />,
      title: 'No Data Available',
      description: message || 'There is no data to display at the moment.',
    },
    'no-users': {
      icon: <Users />,
      title: 'No Users Found',
      description: message || 'No users match your search criteria.',
    },
    'error': {
      icon: <AlertCircle />,
      title: 'Error Loading Data',
      description: message || 'Failed to load data. Please try again.',
    },
  };

  const { icon, title, description } = config[type];

  return (
    <div className="empty-state-container">
      <div className={`empty-state-icon-wrapper ${type}`}>{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="empty-state-retry-btn">
          Try Again
        </button>
      )}
    </div>
  );
}
