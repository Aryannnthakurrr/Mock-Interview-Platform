import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        const PARTICLE_COUNT = 400;
        const MAX_DIST = 120;

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.radius = Math.random() * 2.5 + 0.5;
                this.baseRadius = this.radius;
                this.opacity = Math.random() * 0.4 + 0.3;

                const colors = [
                    [99, 102, 241],
                    [168, 85, 247],
                    [236, 72, 153],
                    [139, 92, 246],
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                const dx = mouseRef.current.x - this.x;
                const dy = mouseRef.current.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    const angle = Math.atan2(dy, dx);
                    this.vx -= Math.cos(angle) * force * 0.5;
                    this.vy -= Math.sin(angle) * force * 0.5;
                    this.radius = this.baseRadius + force * 3;
                } else {
                    this.radius += (this.baseRadius - this.radius) * 0.05;
                }

                this.x += this.vx;
                this.y += this.vy;

                this.vx *= 0.99;
                this.vy *= 0.99;

                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;

                this.x = Math.max(0, Math.min(w, this.x));
                this.y = Math.max(0, Math.min(h, this.y));
            }

            draw(ctx) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`;
                ctx.fill();

                if (this.radius > this.baseRadius + 1) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.05)`;
                    ctx.fill();
                }
            }
        }

        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

        function drawConnections(ctx, particles) {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < MAX_DIST) {
                        const opacity = ((MAX_DIST - dist) / MAX_DIST) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, w, h);

            const grd1 = ctx.createRadialGradient(w * 0.2, h * 0.5, 0, w * 0.2, h * 0.5, w * 0.5);
            grd1.addColorStop(0, 'rgba(99, 102, 241, 0.03)');
            grd1.addColorStop(1, 'transparent');
            ctx.fillStyle = grd1;
            ctx.fillRect(0, 0, w, h);

            const grd2 = ctx.createRadialGradient(w * 0.8, h * 0.5, 0, w * 0.8, h * 0.5, w * 0.5);
            grd2.addColorStop(0, 'rgba(168, 85, 247, 0.02)');
            grd2.addColorStop(1, 'transparent');
            ctx.fillStyle = grd2;
            ctx.fillRect(0, 0, w, h);

            particlesRef.current.forEach((p) => {
                p.update();
                p.draw(ctx);
            });

            drawConnections(ctx, particlesRef.current);

            animationRef.current = requestAnimationFrame(animate);
        }

        const handleMouse = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };

        window.addEventListener('mousemove', handleMouse);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouse);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-auto"
            style={{ background: 'transparent' }}
        />
    );
}
