import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size }) => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;
  const IconComponent = icons[name] || LucideIcons.Tag;

  return <IconComponent className={className} size={size} />;
};
