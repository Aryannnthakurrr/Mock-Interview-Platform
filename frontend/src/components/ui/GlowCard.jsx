import React, { useState, useRef } from 'react';

const GlowCard = ({ children, className = '' }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative rounded-xl overflow-hidden bg-black-50 transition-all duration-500 ${isHovered ? '-translate-y-1' : ''
                } ${className}`}
            style={{
                border: '1px solid rgba(131, 156, 181, 0.06)',
                boxShadow: isHovered ? '0 0 30px rgba(131, 156, 181, 0.06)' : 'none',
            }}
        >
            {/* Glow Spotlight */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 z-0"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(131, 156, 181, 0.06), transparent 60%)`,
                }}
            />
            {/* Border glow */}
            <div
                className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-500 z-0"
                style={{
                    opacity: isHovered ? 1 : 0,
                    border: '1px solid rgba(131, 156, 181, 0.15)',
                    borderRadius: 'inherit',
                }}
            />
            <div className="relative z-10 w-full h-full bg-transparent">{children}</div>
        </div>
    );
};

export default GlowCard;
