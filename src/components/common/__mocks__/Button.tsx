import React from 'react';

const Button: React.FC<any> = ({ title, children, onPress, ...props }) => (
  <button onClick={onPress} {...props}>{title || children}</button>
);

export default Button;


