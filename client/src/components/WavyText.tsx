import React from 'react';

interface WavyTextProps {
  text: string;
  className?: string;
  delayOffset?: number;
}

export const WavyText: React.FC<WavyTextProps> = ({ text, className = '', delayOffset = 0.05 }) => {
  return (
    <span className={`inline-flex whitespace-pre ${className}`}>
      {text.split('').map((char, index) => {
        if (char === ' ') return <span key={index} className="w-2" />;
        return (
          <span
            key={index}
            className="inline-block animate-float-medium"
            style={{ animationDelay: `${index * delayOffset}s` }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};
