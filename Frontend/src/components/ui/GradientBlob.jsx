// Animated mesh gradient blob for hero section
export function GradientBlob({ className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary blob — indigo */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-[80px]"
        style={{
          background: '#1E00A9',
          animation: 'blob1 8s ease-in-out infinite alternate',
        }}
      />
      {/* Secondary blob — emerald */}
      <div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-[80px]"
        style={{
          background: '#10B981',
          animation: 'blob2 10s ease-in-out infinite alternate',
        }}
      />
      {/* Tertiary blob — violet */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[60px]"
        style={{
          background: '#6366F1',
          animation: 'blob3 12s ease-in-out infinite alternate',
        }}
      />
    </div>
  );
}
