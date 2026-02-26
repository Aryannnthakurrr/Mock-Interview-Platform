import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const AntigravityScene = () => {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);

    useEffect(() => {
        // 1. Setup Engine & World
        const engine = Matter.Engine.create();
        engineRef.current = engine;

        // Low gravity for a "space" feel but elements still drop
        engine.gravity.y = 0.5;

        // 2. Setup Renderer
        const render = Matter.Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio,
            },
        });
        renderRef.current = render;

        // 3. Create Boundaries (Floor, Walls)
        const thickness = 60;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const boundaries = [
            Matter.Bodies.rectangle(width / 2, height + thickness / 2 - 10, width, thickness, { isStatic: true, render: { visible: false } }), // Floor (slightly raised to keep items visible)
            Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true, render: { visible: false } }), // Left Wall
            Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true, render: { visible: false } }), // Right Wall
            Matter.Bodies.rectangle(width / 2, -1000, width, thickness, { isStatic: true, render: { visible: false } }) // Ceiling (far above)
        ];

        Matter.World.add(engine.world, boundaries);

        // 4. Create Bodies ("Tech" debris)
        const debris = [];
        const colors = ['#00FFFF', '#3b82f6', '#1e293b', '#334155'];

        for (let i = 0; i < 40; i++) {
            const x = Math.random() * width;
            const y = Math.random() * -height - 100; // Drop from above screen
            const size = Math.random() * 30 + 15;

            const isCircle = Math.random() > 0.5;
            const color = colors[Math.floor(Math.random() * colors.length)];

            const commonOptions = {
                restitution: 0.8, // Bounciness
                friction: 0.1,
                density: 0.05,
                render: {
                    fillStyle: 'transparent',
                    strokeStyle: color,
                    lineWidth: 2,
                },
            };

            if (isCircle) {
                debris.push(Matter.Bodies.circle(x, y, size, commonOptions));
            } else {
                debris.push(Matter.Bodies.rectangle(x, y, size * 2, size * 2, { ...commonOptions, chamfer: { radius: 4 } }));
            }
        }

        Matter.World.add(engine.world, debris);

        // 5. Add Mouse Interaction (The "Google Antigravity" draggable feature)
        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false,
                },
            },
        });

        Matter.World.add(engine.world, mouseConstraint);

        // Keep the mouse in sync with rendering
        render.mouse = mouse;

        // 6. Run Engine and Renderer
        Matter.Runner.run(Matter.Runner.create(), engine);
        Matter.Render.run(render);

        // 7. Handle Resize
        const handleResize = () => {
            render.canvas.width = window.innerWidth;
            render.canvas.height = window.innerHeight;
            Matter.Body.setPosition(boundaries[0], { x: window.innerWidth / 2, y: window.innerHeight + thickness / 2 - 10 });
            Matter.Body.setPosition(boundaries[2], { x: window.innerWidth + thickness / 2, y: window.innerHeight / 2 });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            Matter.Render.stop(render);
            Matter.Engine.clear(engine);
            if (render.canvas) {
                render.canvas.remove();
            }
            render.canvas = null;
            render.context = null;
            render.textures = {};
        };
    }, []);

    return (
        <div
            ref={sceneRef}
            className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-auto"
        />
    );
};

export default AntigravityScene;
