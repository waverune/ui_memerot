import Matter from "matter-js";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { debounce } from "lodash";
import "./HomeLogo.css";
import TopNavBar from "./ui_Component/topNavBar.tsx";
// import { Footer } from "./ui_Component/Footer.tsx";

const HomeLogo: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef(Matter.Engine.create());
    const [logos, setLogos] = useState<string[]>([]);
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const maxBodies = isMobile ? 80 : 150; // Increased from 50/100
    const bodiesRef = useRef<Matter.Body[]>([]);

    useEffect(() => {
        import('./logoList.ts').then(module => {
            setLogos(module.default);
        });
    }, []);

    // Add viewport resize handler
    useEffect(() => {
        const handleResize = debounce(() => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            
            // Update render dimensions
            if (engineRef.current && sceneRef.current) {
                const render = Matter.Render.lookAt(Matter.Render.create({
                    element: sceneRef.current,
                    engine: engineRef.current,
                    options: {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        wireframes: false,
                        showAngleIndicator: false,
                    }
                }));
                
                Matter.Render.run(render);
            }
        }, 250);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // First useEffect for physics setup (runs once)
    useEffect(() => {
        if (logos.length === 0) return;
        
        const 
            Render = Matter.Render,
            Runner = Matter.Runner,
            Body = Matter.Body,
            Events = Matter.Events,
            Composite = Matter.Composite,
            Composites = Matter.Composites,
            Common = Matter.Common,
            MouseConstraint = Matter.MouseConstraint,
            Mouse = Matter.Mouse,
            Bodies = Matter.Bodies;

        const engine = engineRef.current;
        const world = engine.world;

        // Clear existing bodies
        Matter.Composite.clear(world, false);
        bodiesRef.current = [];

        // create renderer
        const render = Render.create({
            element: sceneRef.current!,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                showAngleIndicator: false,
            }
        });

        Render.run(render);

        // create runner
        const runner = Runner.create();
        Runner.run(runner, engine);

        // Adjust initial stack parameters
        const stackConfig = {
            mobile: {
                columns: 12,    // Increased from 8
                rows: 5,        // Increased from 3
                gapX: 25,      // Adjusted gap between columns
                gapY: 35,      // Adjusted gap between rows
                startX: window.innerWidth * 0.15, // Adjusted start position
                startY: 50     // Adjusted start height
            },
            desktop: {
                columns: 20,    // Increased from 15
                rows: 7,        // Increased from 5
                gapX: 30,
                gapY: 40,
                startX: window.innerWidth * 0.2,
                startY: 50
            }
        };

        // Modified body creation with adjusted sizes
        const createBody = (x: number, y: number) => {
            if (bodiesRef.current.length >= maxBodies) {
                const oldestBody = bodiesRef.current.shift();
                if (oldestBody) {
                    Matter.Composite.remove(world, oldestBody);
                }
            }

            // Adjusted scale ranges for better visibility
            const scale = isMobile ? 
                Common.random(0.35, 0.65) : // Mobile scale
                Common.random(0.45, 0.85);  // Desktop scale

            // Adjusted radius ranges
            const radius = isMobile ? 
                Common.random(8, 16) :     // Mobile size
                Common.random(12, 20);     // Desktop size

            const newBody = Bodies.circle(x, y, radius, {
                ...bodyOptions,
                render: {
                    sprite: {
                        texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                        xScale: scale,
                        yScale: scale,
                    }
                }
            });

            bodiesRef.current.push(newBody);
            return newBody;
        };

        // Adjusted body options for better physics
        const bodyOptions = {
            frictionAir: 0.001 * (isMobile ? 1.2 : 1),
            friction: 0.15,      // Reduced friction
            restitution: 0.6,    // Increased bounce
            density: 0.001 * (isMobile ? 1.1 : 1),
            render: {
                sprite: {
                    xScale: 0.5 * (isMobile ? 0.8 : 1),
                    yScale: 0.5 * (isMobile ? 0.8 : 1)
                }
            }
        };

        // add bodies (invisible walls)
        Composite.add(world, [
            // Top wall
            Bodies.rectangle(window.innerWidth / 2, -10, window.innerWidth, 20, { 
                isStatic: true,
                render: { visible: false },
                friction: 1,
                restitution: 0.5,
                slop: 0,
                density: 1
            }),
            // Bottom wall
            Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 10, window.innerWidth, 20, { 
                isStatic: true,
                render: { visible: false },
                friction: 1,
                restitution: 0.5,
                slop: 0,
                density: 1
            }),
            // Right wall
            Bodies.rectangle(window.innerWidth + 10, window.innerHeight / 2, 20, window.innerHeight, { 
                isStatic: true,
                render: { visible: false },
                friction: 1,
                restitution: 0.5,
                slop: 0,
                density: 1
            }),
            // Left wall
            Bodies.rectangle(-10, window.innerHeight / 2, 20, window.innerHeight, { 
                isStatic: true,
                render: { visible: false },
                friction: 1,
                restitution: 0.5,
                slop: 0,
                density: 1
            })
        ]);

        // Modified stack creation with new parameters
        const config = isMobile ? stackConfig.mobile : stackConfig.desktop;
        
        Composite.add(world, Composites.stack(
            config.startX,
            config.startY,
            config.columns,
            config.rows,
            config.gapX,
            config.gapY,
            createBody
        ));

        // Adjusted physics engine parameters
        engine.world.gravity.y = 0.3 * (isMobile ? 0.8 : 1); // Reduced gravity
        engine.constraintIterations = 4;
        engine.positionIterations = 6;
        engine.velocityIterations = 4;

        // Modified explosion parameters
        const explosion = function(engine: Matter.Engine, delta: number) {
            const timeScale = (1000 / 60) / delta;
            const bodies = Composite.allBodies(engine.world)
                .filter(body => !body.isStatic)
                .slice(0, maxBodies);

            bodies.forEach(body => {
                if (body.position.y >= 500) {
                    // Adjusted force for smoother movement
                    const forceMagnitude = (0.015 * body.mass) * timeScale;

                    Body.applyForce(body, body.position, {
                        x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]), 
                        y: -forceMagnitude + Common.random() * -forceMagnitude
                    });
                }
            });
        };

        let timeScaleTarget = 1;
        let lastTime = Common.now();

        Events.on(engine, 'afterUpdate', function(event) {
            if (Common.now() - lastTime >= 2000) {
                timeScaleTarget = timeScaleTarget < 1 ? 1 : 0;
                explosion(engine, event.delta);
                lastTime = Common.now();
            }
        });

        // add mouse control
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Composite.add(world, mouseConstraint);
        render.mouse = mouse;

        // fit the render viewport to the scene
        Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: window.innerWidth, y: window.innerHeight }
        });

        // Add this after creating the engine and world, but before the cleanup function
        const handleKeyPress = (event: KeyboardEvent) => {
            const bodies = Composite.allBodies(world);
            const force = 0.03;

            if (event.repeat) return; // Prevent key repeat events

            bodies.forEach(body => {
                if (!body.isStatic) {
                    switch(event.key) {
                        case 'ArrowUp':
                            Body.applyForce(body, body.position, { x: 0, y: -force });
                            break;
                        case 'ArrowDown':
                            Body.applyForce(body, body.position, { x: 0, y: force });
                            break;
                        case 'ArrowLeft':
                            Body.applyForce(body, body.position, { x: -force, y: 0 });
                            break;
                        case 'ArrowRight':
                            Body.applyForce(body, body.position, { x: force, y: 0 });
                            break;
                        case ' ': // Spacebar
                            setIsSpacebarPressed(true);
                            break;
                    }
                }
            });
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === ' ') {
                setIsSpacebarPressed(false);
            }
        };

        // Add a blur event handler to reset spacebar state when window loses focus
        const handleBlur = () => {
            setIsSpacebarPressed(false);
        };

        // Add all event listeners
        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        // Add touch events support
        const touchHandler = (event: TouchEvent) => {
            const bodies = Composite.allBodies(world);
            const force = isMobile ? 0.02 : 0.03;
            const touch = event.touches[0];
            
            bodies.forEach(body => {
                if (!body.isStatic) {
                    const dx = touch.clientX - body.position.x;
                    const dy = touch.clientY - body.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        Body.applyForce(body, body.position, {
                            x: (dx / distance) * force,
                            y: (dy / distance) * force
                        });
                    }
                }
            });
        };

        window.addEventListener('touchmove', touchHandler, { passive: true });
        
        // Cleanup function
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('touchmove', touchHandler);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
            Matter.Engine.clear(engine);
            render.canvas.remove();
            if (render.canvas) {
                render.canvas.remove();
            }
        };
    }, [logos, isMobile, maxBodies]); // Remove isSpacebarPressed from dependencies

    // Second useEffect for handling spacebar state
    useEffect(() => {
        if (logos.length === 0) return;
        
        const engine = engineRef.current;
        const world = engine.world;

        // Add attraction force when spacebar is pressed
        const attractionUpdate = () => {
            if (isSpacebarPressed) {
                const bodies = Matter.Composite.allBodies(world);
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const attractionForce = 0.003;

                bodies.forEach(body => {
                    if (!body.isStatic) {
                        const dx = centerX - body.position.x;
                        const dy = centerY - body.position.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 1) {
                            const force = {
                                x: (dx / distance) * attractionForce * body.mass,
                                y: (dy / distance) * attractionForce * body.mass
                            };
                            Matter.Body.applyForce(body, body.position, force);
                        }
                    }
                });
            }
        };

        // Add the update function to the engine
        Matter.Events.on(engine, 'beforeUpdate', attractionUpdate);

        // Cleanup
        return () => {
            Matter.Events.off(engine, 'beforeUpdate', attractionUpdate);
        };
    }, [isSpacebarPressed, logos]);

    // Return the container div for the Matter.js scene
    return (
        <>
        <TopNavBar />
        <div 
            ref={sceneRef} 
            className="scene-container"
            style={{ 
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                overflow: 'hidden',
                background: 'linear-gradient(to right, #0f172a, #1e3a8a)',
                isolation: 'isolate'
            }}
        >
            {/* Canvas container */}
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1
                }}
            />
            
            {/* Content overlay */}
            <div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full max-w-4xl px-4"
                style={{ 
                    pointerEvents: 'none',
                    background: 'transparent'
                }}
            >
                <h1 className={`${isMobile ? 'text-5xl' : 'text-8xl'} font-extrabold mb-12 tracking-widest leading-tight`}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-white">
                        MemeR0t
                    </span>
                </h1>
                <p className={`text-white mb-12 ${isMobile ? 'text-base' : 'text-lg'} max-w-2xl mx-auto`}>
                User-friendly multi-swap router built for easy token diversification. With just one click, you can convert assets like Ethereum into a custom mix of tokens—like a 50:50 split between SPX and HPOS. Our platform offers a simple way to manage risk and diversify portfolios through customizable, shareable token presets.
                <br />
                <br />
                Our goal is to help you reduce risk, avoid impulsive investments, and grow smarter with your assets. Share your allocations and contribute to a network where diversification happens naturally.
                </p>
                <Link to="/swap" style={{ pointerEvents: 'auto' }}>
                    <button className={`px-8 py-4 ${isMobile ? 'text-lg' : 'text-xl'} bg-pink-600 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all`}>
                        Go to Swap Page
                    </button>
                </Link>
                <Link to="/discover" style={{ pointerEvents: 'auto' }}>
                    <button className={`px-8 py-4 ${isMobile ? 'text-lg' : 'text-xl'}  mx-4 bg-pink-600 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all`}>
                       Discover!
                    </button>
                </Link>
            </div>
        </div>
        {/* <Footer /> */}
        </>
    );
};

export default HomeLogo;