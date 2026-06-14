import React from 'react';

const AvatarFallback = ({ src, alt, name, style, className, onClick }) => {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || alt || 'User')}&background=random`;

  return (
    <img
      src={src || fallbackUrl}
      alt={alt || name || 'Avatar'}
      style={style}
      className={className}
      onClick={onClick}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = fallbackUrl;
      }}
    />
  );
};

export default AvatarFallback;
