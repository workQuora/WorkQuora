import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div className={`card-elevated p-5 ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
