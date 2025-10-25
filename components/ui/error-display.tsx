
interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ 
  title = "Oops!", 
  message, 
  onRetry 
}: ErrorDisplayProps) {
  return (
    <div className="error-container">
      {/* Cartoon Car-Human Character */}
      <div 
        className="error-character" 
        onClick={onRetry} 
        style={{ cursor: onRetry ? 'pointer' : 'default' }}
        title={onRetry ? "Click to retry" : undefined}
      >
        {/* Rain Cloud */}
        <div className="rain-cloud">
          <div className="cloud-body">
            <div className="cloud-puff cloud-puff-1"></div>
            <div className="cloud-puff cloud-puff-2"></div>
            <div className="cloud-puff cloud-puff-3"></div>
          </div>
          <div className="rain-drops">
            <div className="rain-drop drop-1"></div>
            <div className="rain-drop drop-2"></div>
            <div className="rain-drop drop-3"></div>
            <div className="rain-drop drop-4"></div>
          </div>
        </div>

        {/* Car-Human Hybrid Character */}
        <div className="car-character">
          {/* Car Hood/Head */}
          <div className="car-hood">
            {/* Headlights as Eyes */}
            <div className="headlights">
              <div className="headlight headlight-left">
                <div className="light-inner"></div>
                <div className="pupil"></div>
              </div>
              <div className="headlight headlight-right">
                <div className="light-inner"></div>
                <div className="pupil"></div>
              </div>
            </div>
            
            {/* Grille as Mouth */}
            <div className="grille-mouth">
              <div className="grille-line"></div>
              <div className="grille-line"></div>
              <div className="grille-line"></div>
            </div>
          </div>

          {/* Body/Windshield */}
          <div className="car-body">
            <div className="windshield"></div>
            <div className="body-main"></div>
          </div>

          {/* Arms (side mirrors) */}
          <div className="arms">
            <div className="arm arm-left"></div>
            <div className="arm arm-right"></div>
          </div>

          {/* Wheels */}
          <div className="wheels">
            <div className="wheel wheel-left">
              <div className="wheel-rim"></div>
              <div className="wheel-center"></div>
            </div>
            <div className="wheel wheel-right">
              <div className="wheel-rim"></div>
              <div className="wheel-center"></div>
            </div>
          </div>
        </div>

        {/* Puddle Effect */}
        <div className="puddle"></div>
      </div>

      {/* Error Content */}
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="error-retry-btn">
            <span className="btn-emoji">🔧</span>
            Click to Try Again
          </button>
        )}
      </div>

      <style jsx>{`
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          min-height: 400px;
          animation: slideInDown 0.6s ease-out;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-character {
          position: relative;
          width: 200px;
          height: 200px;
          margin-bottom: 2rem;
          animation: shake 3s ease-in-out infinite;
          transition: transform 0.3s ease;
        }

        .error-character:hover {
          transform: scale(1.05);
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-3px) rotate(-1deg);
          }
          75% {
            transform: translateX(3px) rotate(1deg);
          }
        }

        .rain-cloud {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          animation: cloudFloat 3s ease-in-out infinite;
        }

        @keyframes cloudFloat {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        .cloud-body {
          position: relative;
          width: 80px;
          height: 30px;
        }

        .cloud-puff {
          position: absolute;
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
          border-radius: 50%;
          animation: puffBreathe 2s ease-in-out infinite;
        }

        @keyframes puffBreathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .cloud-puff-1 {
          width: 30px;
          height: 30px;
          left: 0;
          top: 5px;
        }

        .cloud-puff-2 {
          width: 40px;
          height: 35px;
          left: 20px;
          top: 0;
          z-index: 2;
        }

        .cloud-puff-3 {
          width: 30px;
          height: 30px;
          left: 50px;
          top: 5px;
        }

        .rain-drops {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
        }

        .rain-drop {
          position: absolute;
          width: 3px;
          height: 12px;
          background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
          border-radius: 0 0 50% 50%;
          animation: rainFall 1.5s linear infinite;
          opacity: 0;
        }

        .drop-1 {
          left: 10px;
          animation-delay: 0s;
        }

        .drop-2 {
          left: 25px;
          animation-delay: 0.3s;
        }

        .drop-3 {
          left: 40px;
          animation-delay: 0.6s;
        }

        .drop-4 {
          left: 55px;
          animation-delay: 0.9s;
        }

        @keyframes rainFall {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(60px);
          }
        }

        .car-character {
          position: relative;
          width: 160px;
          height: 120px;
          margin: 40px auto 0;
        }

        .car-hood {
          position: relative;
          width: 120px;
          height: 80px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 50% 50% 20% 20% / 60% 60% 40% 40%;
          margin: 0 auto;
          box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
          animation: bodyBounce 2s ease-in-out infinite;
          z-index: 5;
        }

        @keyframes bodyBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        .headlights {
          position: absolute;
          top: 25px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 35px;
        }

        .headlight {
          position: relative;
          width: 24px;
          height: 28px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          animation: blink 4s infinite;
        }

        @keyframes blink {
          0%, 48%, 52%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.1);
          }
        }

        .light-inner {
          position: absolute;
          width: 18px;
          height: 22px;
          background: #fef3c7;
          border-radius: 50%;
          top: 3px;
          left: 3px;
        }

        .pupil {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #1e293b;
          border-radius: 50%;
          top: 9px;
          left: 7px;
          animation: lookAround 4s ease-in-out infinite;
        }

        @keyframes lookAround {
          0%, 20%, 40%, 60%, 80%, 100% {
            transform: translate(0, 0);
          }
          10%, 30% {
            transform: translate(-3px, 0);
          }
          50%, 70% {
            transform: translate(3px, 0);
          }
        }

        .grille-mouth {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 20px;
          background: #1e293b;
          border-radius: 0 0 20px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding: 3px;
          animation: mouthSad 2s ease-in-out infinite;
        }

        @keyframes mouthSad {
          0%, 100% {
            height: 20px;
          }
          50% {
            height: 18px;
          }
        }

        .grille-line {
          width: 100%;
          height: 2px;
          background: #475569;
          border-radius: 1px;
        }

        .car-body {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 40px;
        }

        .windshield {
          width: 60px;
          height: 20px;
          background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
          border-radius: 10px 10px 0 0;
          margin: 0 auto;
          position: relative;
          opacity: 0.7;
        }

        .body-main {
          width: 100%;
          height: 25px;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          border-radius: 5px;
          margin-top: -5px;
        }

        .arms {
          position: absolute;
          top: 70px;
          width: 160px;
          left: 50%;
          transform: translateX(-50%);
        }

        .arm {
          position: absolute;
          width: 25px;
          height: 8px;
          background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%);
          border-radius: 5px;
          animation: armWave 2s ease-in-out infinite;
        }

        .arm-left {
          left: 0;
          transform-origin: right center;
          animation-delay: 0s;
        }

        .arm-right {
          right: 0;
          transform-origin: left center;
          animation-delay: 0.5s;
        }

        @keyframes armWave {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-10deg);
          }
        }

        .wheels {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 140px;
          display: flex;
          justify-content: space-between;
        }

        .wheel {
          position: relative;
          width: 35px;
          height: 35px;
          background: #1e293b;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
          animation: wheelRotate 2s linear infinite;
        }

        @keyframes wheelRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .wheel-rim {
          position: absolute;
          width: 25px;
          height: 25px;
          background: #64748b;
          border-radius: 50%;
          top: 5px;
          left: 5px;
        }

        .wheel-center {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #cbd5e1;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .puddle {
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 8px;
          background: radial-gradient(ellipse, rgba(96, 165, 250, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: puddleGrow 2s ease-in-out infinite;
        }

        @keyframes puddleGrow {
          0%, 100% {
            width: 100px;
            opacity: 0.4;
          }
          50% {
            width: 110px;
            opacity: 0.6;
          }
        }

        .error-content {
          max-width: 500px;
          animation: bounceIn 0.8s ease-out 0.3s backwards;
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          60% {
            opacity: 1;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .error-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 0.75rem;
          font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif;
          text-shadow: 2px 2px 0 #e5e7eb;
          animation: wiggle 0.5s ease-in-out 1s backwards;
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-3deg);
          }
          75% {
            transform: rotate(3deg);
          }
        }

        .error-message {
          font-size: 1rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          padding: 0 1rem;
        }

        .error-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          position: relative;
          overflow: hidden;
          animation: buttonPop 0.6s ease-out 1.2s backwards;
        }

        @keyframes buttonPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .error-retry-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .error-retry-btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .error-retry-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
        }

        .error-retry-btn:active {
          transform: translateY(-1px) scale(0.98);
        }

        .btn-emoji {
          font-size: 1.25rem;
          display: inline-block;
          animation: toolSpin 2s ease-in-out infinite;
        }

        @keyframes toolSpin {
          0%, 80%, 100% {
            transform: rotate(0deg);
          }
          85%, 95% {
            transform: rotate(15deg);
          }
          90% {
            transform: rotate(-15deg);
          }
        }

        @media (prefers-color-scheme: dark) {
          .error-title {
            color: #f9fafb;
            text-shadow: 2px 2px 0 #374151;
          }
          .error-message {
            color: #d1d5db;
          }
        }

        @media (max-width: 640px) {
          .error-container {
            padding: 2rem 1rem;
            min-height: 350px;
          }
          .error-character {
            width: 160px;
            height: 160px;
            transform: scale(0.85);
          }
          .error-title {
            font-size: 1.5rem;
          }
          .error-message {
            font-size: 0.875rem;
          }
          .error-retry-btn {
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}
