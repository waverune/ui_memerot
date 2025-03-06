import 'nes.css/css/nes.min.css'; 
import './HomeLogo.css';
import Bushes_desktop from '../assets/pixelArt.png';
import Heart from '../assets/heart.png';
import Diamond from '../assets/gemdesi2.png';
import NewImage from '../assets/images.png';
import Wassie from '../assets/wassie.png';
import Cloud from '../assets/cloud.png';
import React, { useMemo } from 'react';

function HomeLogo() {
    // Generate random positioning for clouds with no overlap
    const cloudPositions = useMemo(() => {
        const positions = [];
        const maxClouds = 5;
        const cloudZones = [
            { left: 0, right: 30, top: 0, bottom: 40 },    // Left top
            { left: 70, right: 100, top: 0, bottom: 40 },  // Right top
            { left: 0, right: 30, top: 60, bottom: 100 },  // Left bottom
            { left: 70, right: 100, top: 60, bottom: 100 } // Right bottom
        ];

        while (positions.length < maxClouds && cloudZones.length > 0) {
            // Randomly select a zone
            const zoneIndex = Math.floor(Math.random() * cloudZones.length);
            const zone = cloudZones[zoneIndex];

            // Generate cloud position within the selected zone
            const cloudPosition = {
                left: `${zone.left + Math.floor(Math.random() * (zone.right - zone.left - 20))}%`,
                top: `${zone.top + Math.floor(Math.random() * (zone.bottom - zone.top - 20))}%`,
                width: `${Math.floor(Math.random() * 150) + 100}px`
            };

            positions.push(cloudPosition);

            // Remove the used zone to prevent further clouds in that area
            cloudZones.splice(zoneIndex, 1);
        }

        return positions;
    }, []);

    return (
        <>
        {cloudPositions.map((position, index) => (
            <div 
                key={index} 
                className="cloud-container" 
                style={{
                    left: position.left,
                    top: position.top,
                    width: position.width
                }}
            >
                <img 
                    src={Cloud} 
                    alt={`Cloud ${index + 1}`} 
                    className="cloud-image" 
                />
            </div>
        ))}
        <div className="centered-container">
            <div className="box">
            <div className="logo-container">
                <img 
                    src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzlkZmhocjFmYzJiZmoxY3B0Z3BqbTdrYjVrZXg2bmFpd3BpaDNqcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9ZQ/LOnt6uqjD9OexmQJRB/giphy.gif"
                    alt="Description of GIF"
                    className="logo-gif"
                />
            <div>
                MemeR0t
            </div>
            </div>
            </div>
        </div>
        <div className="wassie-container">
            <img 
                src={Wassie} 
                alt="Wassie" 
                className="wassie-image" 
            />
        </div>
        <div className="hearts-container">
            {[...Array(6)].map((_, index) => (
                <img 
                    key={index} 
                    src={Heart} 
                    alt="Heart" 
                    className="heart-image" 
                />
            ))}
        </div>
        <div className="new-image-container">
            <img 
                src={NewImage} 
                alt="New Image" 
                className="new-image" 
            />
        </div>
        <div className="diamond-container">
            {[...Array(6)].map((_, index) => (
                <img 
                    key={index} 
                    src={Diamond}
                    alt="Diamond" 
                    className="heart-image" 
                />
            ))}
        </div>
        <div className="bushes-container">
            <img src={Bushes_desktop} alt="Pixel Art" />
        </div>
        </>
    )
}   

export default HomeLogo;
