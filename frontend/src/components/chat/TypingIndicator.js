import React from 'react';

const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 animate-fade-in-up">
      <div
        className="px-4 py-3.5 rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderBottomLeftRadius: '4px',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        <div className="flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#34a853', animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#34a853', animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#34a853', animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
