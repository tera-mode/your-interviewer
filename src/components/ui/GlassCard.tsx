'use client';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'voxel' | 'elevated';
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, variant = 'default', className = '', onClick }: GlassCardProps) {
  const variantClasses = {
    default: 'glass-card',
    voxel: 'glass-card border-2 border-white/60 shadow-lg',
    elevated: 'glass-card shadow-xl',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`rounded-2xl p-6 ${variantClasses[variant]} ${onClick ? 'text-left transition-all hover:scale-[1.02] hover-glow btn-press' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
