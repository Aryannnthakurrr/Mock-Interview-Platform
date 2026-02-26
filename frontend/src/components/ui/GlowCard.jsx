import React, { useState, useRef, useCallback } from 'react';

const GlowCard = ({ children, className = '' }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();

        // Track position for radial spotlight
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });

        // Calculate angle from card center to mouse for rotating border glow
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        let angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
        angle = (angle + 360) % 360;

        cardRef.current.style.setProperty('--start', angle + 60);
    }, []);

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`card-glow relative rounded-xl overflow-hidden bg-black-50 transition-all duration-500 ${isHovered ? '-translate-y-1' : ''
                } ${className}`}
            style={{
                border: '1px solid rgba(131, 156, 181, 0.06)',
                boxShadow: isHovered ? '0 0 30px rgba(131, 156, 181, 0.06)' : 'none',
            }}
        >
            {/* Rotating border glow (driven by ::before in CSS via --start) */}
            <div className="glow" />

            {/* Radial spotlight that follows cursor */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 z-0"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(131, 156, 181, 0.06), transparent 60%)`,
                }}
            />

            <div className="relative z-10 w-full h-full bg-transparent">{children}</div>
        </div>
    );
};

export default GlowCard;
