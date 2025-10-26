
interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ 
  title = "Oops! Something Went Wrong", 
  message, 
  onRetry 
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      {/* Car with smoke animation - same car as loading */}
      <div className="relative mb-8">
        {/* Smoke clouds */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <div className="relative w-24 h-20">
            {/* Cloud 1 */}
            <div className="absolute left-2 top-0 w-12 h-12 bg-gray-400/60 rounded-full animate-smoke-1" />
            {/* Cloud 2 */}
            <div className="absolute left-7 top-4 w-10 h-10 bg-gray-400/40 rounded-full animate-smoke-2" />
            {/* Cloud 3 */}
            <div className="absolute left-12 top-1 w-11 h-11 bg-gray-400/50 rounded-full animate-smoke-3" />
          </div>
        </div>
        
        {/* Car SVG - same as page transition */}
        <svg
          className="w-[120px] h-[60px]"
          viewBox="0 0 120 60"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Car Shadow */}
          <ellipse
            cx="60"
            cy="55"
            rx="35"
            ry="3"
            fill="rgba(0,0,0,0.2)"
          />
          
          {/* Car Body */}
          <path
            d="M 30 40 L 20 40 Q 15 40 15 35 L 15 30 Q 15 25 20 25 L 35 25 L 40 15 Q 42 10 47 10 L 73 10 Q 78 10 80 15 L 85 25 L 100 25 Q 105 25 105 30 L 105 35 Q 105 40 100 40 L 90 40"
            fill="hsl(var(--destructive))"
            stroke="hsl(var(--destructive-foreground))"
            strokeWidth="1"
            opacity="0.9"
          />
          
          {/* Car Windows */}
          <path
            d="M 42 15 L 47 15 L 52 23 L 42 23 Z"
            fill="white"
            opacity="0.3"
          />
          <path
            d="M 68 15 L 73 15 L 78 23 L 68 23 Z"
            fill="white"
            opacity="0.3"
          />
          
          {/* Headlights - dimmed for error state */}
          <circle cx="18" cy="32" r="2" fill="#FFD700" opacity="0.3" />
          <circle cx="102" cy="32" r="2" fill="#FFD700" opacity="0.3" />
          
          {/* Wheels */}
          <g>
            <circle cx="30" cy="42" r="6" fill="hsl(var(--muted-foreground))" />
            <circle cx="30" cy="42" r="3" fill="hsl(var(--muted))" />
            <line x1="30" y1="39" x2="30" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
            <line x1="27" y1="42" x2="33" y2="42" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
          </g>
          
          <g>
            <circle cx="90" cy="42" r="6" fill="hsl(var(--muted-foreground))" />
            <circle cx="90" cy="42" r="3" fill="hsl(var(--muted))" />
            <line x1="90" y1="39" x2="90" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
            <line x1="87" y1="42" x2="93" y2="42" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* Error Content */}
      <div className="max-w-md">
        <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            <span className="text-lg">🔧</span>
            Click to Try Again
          </button>
        )}
      </div>
    </div>
  );
}
