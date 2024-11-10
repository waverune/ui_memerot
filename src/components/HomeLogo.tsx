import Matter from "matter-js";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HomeLogo: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef(Matter.Engine.create());
    const [logos, setLogos] = useState<string[]>([]);
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);

    useEffect(() => {
        import('./logoList.ts').then(module => {
            setLogos(module.default);
        });
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

        // add bodies
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
engine.world.gravity.y = 0.5;
engine.constraintIterations = 6;
engine.positionIterations = 8;
engine.velocityIterations = 8;

        const explosion = function(engine: Matter.Engine, delta: number) {
            const timeScale = (1000 / 60) / delta;
            const bodies = Composite.allBodies(engine.world);

            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];

                if (!body.isStatic && body.position.y >= 500) {
                    const forceMagnitude = (0.02 * body.mass) * timeScale;

                    Body.applyForce(body, body.position, {
                        x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]), 
                        y: -forceMagnitude + Common.random() * -forceMagnitude
                    });
                }
            }
        };

        let timeScaleTarget = 1;
        let lastTime = Common.now();

        Events.on(engine, 'afterUpdate', function(event) {
            // engine.timing.timeScale += (timeScaleTarget - engine.timing.timeScale) * 12 * timeScale;

            if (Common.now() - lastTime >= 2000) {
                timeScaleTarget = timeScaleTarget < 1 ? 1 : 0;
                explosion(engine, event.timestamp);
                lastTime = Common.now();
            }
        });

        const bodyOptions = {
            frictionAir: 0.001  ,
            friction: 0.2,
            restitution: 0.5,
            density: 0.001,
            render: {
                sprite: {
                    texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                    xScale: 0.5,
                    yScale: 0.5
                }
            }
        };
        
        Composite.add(world, Composites.stack(window.innerWidth/4, 100, 20, 5   , 20, 40, function(x: number, y: number ) {
            const scale = Common.random(0.4, 0.8);
            return Bodies.circle(x, y, Common.random(10, 20), {
                ...bodyOptions,
                render: {
                    sprite: {
                        texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                        xScale: scale,
                        yScale: scale,
                    }
                }
            });
        }));

        Composite.add(world, Composites.stack(50, 50, 12, 4, 0, 0, function(x: number, y: number ) {
            switch (Math.round(Common.random(0, 1))) {
                case 0:
                    if (Common.random() < 0.8) {
                        return Bodies.rectangle(x, y, Common.random(20, 50), Common.random(20, 50), {
                            ...bodyOptions,
                            render:{
                                sprite:{
                                    texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                                    xScale: 0.5,
                                    yScale: 0.5
                                }
                            }
                        });
                    } else {
                        return Bodies.rectangle(x, y, Common.random(80, 120), Common.random(20, 30), {
                            ...bodyOptions,
                            render:{
                                sprite:{
                                    texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                                    xScale: 0.5,
                                    yScale: 0.5 
                                }
                            }
                        });
                    }
                case 1:
                    return Bodies.polygon(x, y, Math.round(Common.random(4, 8)), Common.random(20, 50), {
                        ...bodyOptions,
                        render:{
                            sprite:{
                                texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                                xScale: 0.5,
                                yScale: 0.5
                            }
                        }
                    });
                default:
                    return Bodies.circle(x, y, Common.random(10, 20), {
                        ...bodyOptions,
                        render:{
                            sprite:{
                                texture: logos.length > 0 ? `/logos/${logos[Math.floor(Math.random() * logos.length)]}` : '',
                                xScale: 0.5,
                                yScale: 0.5
                            }
                        }
                    });
            }
        }));

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

        // Cleanup function
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
            Matter.Engine.clear(engine);
            render.canvas.remove();
            if (render.canvas) {
                render.canvas.remove();
            }
        };
    }, [logos]); // Remove isSpacebarPressed from dependencies

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
        <div 
            ref={sceneRef} 
            className="scene-container"
            style={{ 
                width: '100vw',
                height: '100vh',
                position: 'absolute',
                top: 0,
                left: 0
            }}
        >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full max-w-4xl px-4">
                <h1 className="text-8xl font-extrabold mb-12 tracking-widest leading-tight" style={{ fontFamily: "'Roboto Mono', monospace" }}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-white">
                        MemeR0t
                    </span>
                </h1>
                <p className="text-white mb-12 text-lg max-w-2xl mx-auto">
                User-friendly multi-swap router built for easy token diversification. With just one click, you can convert assets like Ethereum into a custom mix of tokens—like a 50:50 split between SPX and HPOS. Our platform offers a simple way to manage risk and diversify portfolios through customizable, shareable token presets.
                <br />
                <br />
                Our goal is to help you reduce risk, avoid impulsive investments, and grow smarter with your assets. Share your allocations and contribute to a network where diversification happens naturally.
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