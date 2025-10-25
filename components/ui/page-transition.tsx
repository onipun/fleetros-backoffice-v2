'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPathname) {
      // Show car animation immediately
      setIsTransitioning(true);
      
      // Wait a bit before updating the page content
      const contentTimer = setTimeout(() => {
        setDisplayChildren(children);
      }, 400); // Delay content update to let animation play

      // Hide animation after it completes
      const animationTimer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevPathname(pathname);
      }, 800);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(animationTimer);
      };
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, prevPathname, children]);

  return (
    <>
      {isTransitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="car-transition-container">
            <div className="car-wrapper">
              {/* Car Body */}
              <svg
                className="car-svg"
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
                  className="car-shadow"
                />
                
                {/* Car Body */}
                <path
                  d="M 30 40 L 20 40 Q 15 40 15 35 L 15 30 Q 15 25 20 25 L 35 25 L 40 15 Q 42 10 47 10 L 73 10 Q 78 10 80 15 L 85 25 L 100 25 Q 105 25 105 30 L 105 35 Q 105 40 100 40 L 90 40"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary-foreground))"
                  strokeWidth="1"
                  opacity="0.9"
                />
                
                {/* Car Windows */}
                <path
                  d="M 42 15 L 47 15 L 52 23 L 42 23 Z"
                  fill="hsl(var(--primary-foreground))"
                  opacity="0.3"
                />
                <path
                  d="M 68 15 L 73 15 L 78 23 L 68 23 Z"
                  fill="hsl(var(--primary-foreground))"
                  opacity="0.3"
                />
                
                {/* Headlights */}
                <circle cx="18" cy="32" r="2" fill="#FFD700" opacity="0.8" className="headlight" />
                <circle cx="102" cy="32" r="2" fill="#FFD700" opacity="0.8" className="headlight" />
                
                {/* Wheels */}
                <g className="wheel-left">
                  <circle cx="30" cy="42" r="6" fill="hsl(var(--muted-foreground))" />
                  <circle cx="30" cy="42" r="3" fill="hsl(var(--muted))" />
                  <line x1="30" y1="39" x2="30" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  <line x1="27" y1="42" x2="33" y2="42" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                </g>
                
                <g className="wheel-right">
                  <circle cx="90" cy="42" r="6" fill="hsl(var(--muted-foreground))" />
                  <circle cx="90" cy="42" r="3" fill="hsl(var(--muted))" />
                  <line x1="90" y1="39" x2="90" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  <line x1="87" y1="42" x2="93" y2="42" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                </g>
                
                {/* Speed lines */}
                <line x1="5" y1="20" x2="12" y2="20" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" className="speed-line" />
                <line x1="8" y1="28" x2="15" y2="28" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" className="speed-line" style={{ animationDelay: '0.1s' }} />
                <line x1="3" y1="36" x2="10" y2="36" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" className="speed-line" style={{ animationDelay: '0.2s' }} />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      <div className={`page-content ${isTransitioning ? 'page-transitioning' : ''}`}>
        {displayChildren}
      </div>

      <style jsx>{`
        .car-transition-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: fadeInOut 0.8s ease-in-out;
        }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }

        .car-wrapper {
          animation: carBounce 0.4s ease-in-out infinite;
        }

        @keyframes carBounce {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-8px) translateX(-3px);
          }
          50% {
            transform: translateY(0) translateX(3px);
          }
          75% {
            transform: translateY(-8px) translateX(-3px);
          }
        }

        .car-svg {
          width: 120px;
          height: 60px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .wheel-left, .wheel-right {
          animation: rotateWheel 0.3s linear infinite;
          transform-origin: center;
        }

        .wheel-left {
          transform-origin: 30px 42px;
        }

        .wheel-right {
          transform-origin: 90px 42px;
        }

        @keyframes rotateWheel {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .car-shadow {
          animation: shadowPulse 0.15s ease-in-out infinite;
        }

        @keyframes shadowPulse {
          0%, 100% {
            transform: scaleX(1);
            opacity: 0.2;
          }
          50% {
            transform: scaleX(0.95);
            opacity: 0.15;
          }
        }

        .headlight {
          animation: headlightBlink 0.5s ease-in-out infinite;
        }

        @keyframes headlightBlink {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        .speed-line {
          animation: speedLine 0.3s ease-out infinite;
        }

        @keyframes speedLine {
          0% {
            opacity: 0.6;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-10px);
          }
        }

        .page-content {
          transition: opacity 0.3s ease-in-out;
        }

        .page-transitioning {
          opacity: 0.7;
        }
      `}</style>
    </>
  );
}
