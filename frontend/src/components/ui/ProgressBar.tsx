import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  maxProgress: number;
  label?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  showPercentage?: boolean;
}

const ProgressBar = ({ 
  progress, 
  maxProgress, 
  label, 
  color = 'blue',
  showPercentage = false 
}: ProgressBarProps) => {
  const percentage = Math.min((progress / maxProgress) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {!showPercentage && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{progress}</span>
          <span>{maxProgress}</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
