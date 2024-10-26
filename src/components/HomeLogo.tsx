import React, { useEffect, useRef, useState } from 'react';
import * as Matter from 'matter-js';
import './HomeLogo.css';
import { Link } from 'react-router-dom';
import { Events } from 'matter-js';

const HomeLogo: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef(Matter.Engine.create({ enableSleeping: true }));
    const [logos, setLogos] = useState<string[]>([]);
    
    useEffect(() => {
        const { Engine, Render, World, Bodies, Composite, Mouse, MouseConstraint, Body } = Matter;
        
        const render = Render.create({
            element: sceneRef.current!,
            engine: engineRef.current,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent',
            }
        });

        const world = engineRef.current.world;
        world.gravity.y = 0.5; // Reduce gravity further

        // Create button and floor
        const buttonWidth = 240; // Make it slightly wider than the visual button
        const buttonHeight = 80; // Make it taller than the visual button
        const buttonY = window.innerHeight * 0.75;
        const buttonRadius = buttonHeight / 2;
        const button = Bodies.rectangle(
            window.innerWidth / 2,
            buttonY,
            buttonWidth - buttonRadius * 2,
            buttonHeight,
            { 
                isStatic: true,
                render: { visible: false },
                chamfer: { radius: buttonHeight / 2 },
                friction: 1,
                restitution: 0, // Maximum bounce
                collisionFilter: {
                    category: 0x0002,
                    mask: 0x0001
                }
            }
        );

        const floor = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight,
            window.innerWidth,
            20,
            { isStatic: true, render: { fillStyle: '#2a2a2a' } }
        );

        const composite = Composite.create();
        const wallThickness = 50;
        const leftWall = Bodies.rectangle(
            -wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { isStatic: true, render: { visible: false } }
        );
        const rightWall = Bodies.rectangle(
            window.innerWidth + wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { isStatic: true, render: { visible: false } }
        );
        Composite.add(composite, [floor, button, leftWall, rightWall]);
        World.add(world, composite);

        // Lazy load logos
        import('./logoList.ts').then(module => {
            setLogos(module.default);
        });

        let bodies: Matter.Body[] = [];
        const maxBodies = 100; // Limit the number of bodies


        const createShape = () => {
            if (bodies.length >= maxBodies) {
                const removedBody = bodies.shift();
                if (removedBody) {
                    World.remove(world, removedBody);
                }
            }

            const margin = window.innerWidth * 0.1;
            const x = margin + Math.random() * (window.innerWidth - 2 * margin);
            const y = -50; // Start above the screen

            const size = 75 + Math.random() * 20;
            const shape = Bodies.rectangle(x, y, size / 2, size / 2, {
                restitution: 0.5,
                friction: 0.1,
                density: 0.001,
                render: {
                    sprite: {
                        texture: `/logos/${logos[Math.floor(Math.random() * logos.length)]}`,
                        xScale: size / 128,
                        yScale: size / 128
                    }
                },
                collisionFilter: {
                    category: 0x0001,
                    mask: 0x0003
                }
            });

            bodies.push(shape);
            Composite.add(world, shape);
        };

        // Add mouse control
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engineRef.current, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        // Enable collision events for mouse constraint
        mouseConstraint.collisionFilter.mask = 0xFFFFFFFF;

        Composite.add(world, mouseConstraint);
        render.mouse = mouse;

        // Use requestAnimationFrame for smoother animation
        let lastTime = 0;
        const animate = (time: number) => {
            const delta = time - lastTime;
            lastTime = time;

            Engine.update(engineRef.current, delta, 1);
            Render.world(render);
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);

        // Create shapes at intervals
        const interval = setInterval(createShape, 1000);

        // Resize handler
        const handleResize = () => {
            render.canvas.width = window.innerWidth;
            render.canvas.height = window.innerHeight;
            Render.setPixelRatio(render, window.devicePixelRatio);
        };

        window.addEventListener('resize', handleResize);

       

        Composite.add(world, [leftWall, rightWall]);
        Matter.Events.on(engineRef.current, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                if (bodyA === button || bodyB === button || bodyA === buttonSensor || bodyB === buttonSensor) {
                    const shape = bodyA === button || bodyA === buttonSensor ? bodyB : bodyA;
                    handleCollision(shape);
                }
            });
        });

        const buttonSensor = Bodies.rectangle(
            window.innerWidth / 2,
            buttonY - buttonHeight / 2 - 2,
            buttonWidth,
            4,
            {
                isStatic: true,
                isSensor: true,
                render: { visible: false },
                collisionFilter: {
                    category: 0x0002,
                    mask: 0x0001
                }
            }
        );

        Composite.add(world, buttonSensor);

        const handleCollision = (shape: Matter.Body) => {
            const shapeHeight = shape.bounds.max.y - shape.bounds.min.y;
            const buttonTop = buttonY - buttonHeight / 2;
            const buttonLeft = button.position.x - buttonWidth / 2 + buttonRadius;
            const buttonRight = button.position.x + buttonWidth / 2 - buttonRadius;

            let targetY;
            if (shape.position.x < buttonLeft) {
                // Left rounded corner
                const dx = buttonLeft - shape.position.x;
                targetY = buttonTop - Math.sqrt(Math.max(0, buttonRadius * buttonRadius - dx * dx));
            } else if (shape.position.x > buttonRight) {
                // Right rounded corner
                const dx = shape.position.x - buttonRight;
                targetY = buttonTop - Math.sqrt(Math.max(0, buttonRadius * buttonRadius - dx * dx));
            } else {
                // Flat top
                targetY = buttonTop;
            }

            // Adjust targetY so the bottom of the shape touches the button
            targetY -= shapeHeight;

            // Set the shape's position and stop its movement
            Matter.Body.setVelocity(shape, { x: 0, y: 0 });
            Matter.Body.setPosition(shape, {
                x: shape.position.x,
                y: targetY
            });
            Matter.Body.setStatic(shape, true);
        };

        return () => {
            clearInterval(interval);
            Render.stop(render);
            World.clear(world, true);
            Engine.clear(engineRef.current);
            render.canvas.remove();
            window.removeEventListener('resize', handleResize);
            if (render.mouse) {
                Mouse.clearSourceEvents(render.mouse);
            }
        };
    }, [logos]);

    return (
        <div ref={sceneRef} className="scene-container">
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full max-w-4xl px-4">
                <h1 className="text-8xl font-extrabold mb-12 tracking-widest leading-tight" style={{ fontFamily: "'Roboto Mono', monospace" }}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-white">
                        MemeR0t
                    </span>
                </h1>
                <p className="text-white mb-12 text-lg max-w-2xl mx-auto">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.
                </p>
                <Link to="/swap">
                    <button className="px-8 py-4 text-xl bg-pink-600 bg-opacity-80 text-white rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-pink-700 hover:bg-opacity-100 hover:shadow-lg hover:shadow-pink-600/50 w-64 text-center">
                        Go to Swap Page
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default HomeLogo;
