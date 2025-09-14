import React from 'react';
import DemoWidget from '../interactiveDemo/DemoWidget';

interface FloatingCallDockProps {
  className?: string;
}

const FloatingCallDock: React.FC<FloatingCallDockProps> = ({ className = '' }) => {
  return <DemoWidget className={className} />;
};

export default FloatingCallDock;
