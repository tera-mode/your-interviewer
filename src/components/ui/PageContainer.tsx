'use client';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-main ${className}`}>
      <div className="gradient-orb gradient-orb-emerald absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-amber absolute -left-40 bottom-20 h-80 w-80" />
      <div className="relative z-10 px-4 py-6">
        <main className="mx-auto max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
