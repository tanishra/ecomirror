'use client';

import React, { useMemo } from 'react';

const MessageBubble = React.memo(function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const displayContent = useMemo(() => message.content.split('<data>')[0].trim(), [message.content]);

  if (!displayContent) return null;

  const renderFormattedText = (text) => {
    if (!text.includes('**') && !text.includes('*')) {
      return text;
    }

    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-extrabold" style={{ color: isUser ? '#a8d5b5' : '#1e8e3e' }}>
            {part}
          </strong>
        );
      }

      if (part.includes('*')) {
        const subParts = part.split('*');
        return subParts.map((subPart, subIndex) => {
          if (subIndex % 2 === 1) {
            return (
              <em key={subIndex} className="italic" style={{ color: isUser ? '#d4e8ff' : 'var(--foreground-muted)' }}>
                {subPart}
              </em>
            );
          }
          return subPart;
        });
      }

      return part;
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in-up`}>
      <div
        className="px-4 py-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] leading-relaxed text-sm"
        style={
          isUser
            ? {
                background: '#1a73e8',
                color: '#fff',
                borderBottomRightRadius: '4px',
                boxShadow: '0 1px 2px rgba(60,64,67,0.2)',
              }
            : {
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border-subtle)',
                borderBottomLeftRadius: '4px',
                boxShadow: 'var(--shadow-1)',
              }
        }
      >
        <div className="whitespace-pre-wrap">{renderFormattedText(displayContent)}</div>
      </div>
    </div>
  );
});

export default MessageBubble;
