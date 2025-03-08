"use client"

import "nes.css/css/nes.min.css"
import "./HomeLogo.css"
import Bushes_desktop from "../assets/pixelArt.png"
import Heart from "../assets/heart.png"
import Diamond from "../assets/gemdesi2.png"
import Doge from "../assets/images.png" // Renamed for clarity
import Pepe from "../assets/wassie.png" // Renamed for clarity
import Cloud from "../assets/cloud.png"
import { useMemo } from "react"
import SwapImage from "../assets/Swap.png"
import SwapPressedImage from "../assets/swappressed.png"
import { useNavigate } from "react-router-dom"

function HomeLogo() {
    const navigate = useNavigate()
    // Generate random positioning for clouds with no overlap
    const cloudPositions = useMemo(() => {
        const positions = []
        const maxClouds = 5// Reduced number of clouds to match target image
        const cloudZones = [
            { left: 5, right: 15, top: 5, bottom: 15 }, // Left top
            { left: 85, right: 95, top: 5, bottom: 15 }, // Right top
            { left: 70, right: 80, top: 50, bottom: 60 }, // Right middle
            { left: 20, right: 30, top: 20, bottom: 30 }, // Left middle
            { left: 40, right: 50, top: 10, bottom: 20 }, // Middle top
            { left: 60, right: 70, top: 30, bottom: 40 }, // Middle right
            { left: 10, right: 20, top: 40, bottom: 50 }, // Left bottom
            { left: 30, right: 40, top: 60, bottom: 70 }, // Bottom middle
        ]

        while (positions.length < maxClouds && cloudZones.length > 0) {
            // Randomly select a zone
            const zoneIndex = Math.floor(Math.random() * cloudZones.length)
            const zone = cloudZones[zoneIndex]

            // Generate cloud position within the selected zone
            const cloudPosition = {
                left: `${zone.left + Math.floor(Math.random() * (zone.right - zone.left - 10))}%`,
                top: `${zone.top + Math.floor(Math.random() * (zone.bottom - zone.top - 10))}%`,
                width: `${Math.floor(Math.random() * 50) + 150}px`,
            }

            positions.push(cloudPosition)

            // Remove the used zone to prevent further clouds in that area
            cloudZones.splice(zoneIndex, 1)
        }

        return positions
    }, [])

    return (
        <div className="retro-background">
            {/* Retro grid overlay */}
            <div className="grid-overlay"></div>

            {/* Clouds */}
            {cloudPositions.map((position, index) => (
                <div
                    key={index}
                    className="cloud-container"
                    style={{
                        left: position.left,
                        top: position.top,
                        width: position.width,
                    }}
                >
                    <img src={Cloud || "/placeholder.svg"} alt={`Cloud ${index + 1}`} className="cloud-image" />
                </div>
            ))}

            {/* Main container */}
            <div className="centered-container">
                <div className="box">
                    <div className="logo-container">
                        {/* Sunglasses emoji */}
                        <img
                            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzlkZmhocjFmYzJiZmoxY3B0Z3BqbTdrYjVrZXg2bmFpd3BpaDNqcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9ZQ/LOnt6uqjD9OexmQJRB/giphy.gif"
                            alt="Cool emoji with sunglasses"
                            className="logo-gif"
                        />

                        {/* MEMEROT text */}
                        <div className="pixel-text">MEMEROT</div>

                        {/* SWAP button */}
                        <div className="swap-button-container">
                            <img
                                src={SwapImage || "/placeholder.svg"}
                                alt="Swap Button"
                                className="swap-button"
                                onClick={() => navigate('/swap')} // Add this line to navigate to /swap
                                onMouseDown={(e) => {
                                    e.currentTarget.src = SwapPressedImage || "/placeholder.svg"
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.src = SwapImage || "/placeholder.svg"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.src = SwapImage || "/placeholder.svg"
                                }}
                            />
                        </div>

                        {/* Tagline text */}
                        <div className="tagline">
                            <div>THE ULTIMATE MEME COIN</div>
                            <div>DIVERSIFICATION DAPP</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pepe character (left) */}
            <div className="pepe-container">
                <img src={Pepe || "/placeholder.svg"} alt="Pepe character" className="pepe-image" />
            </div>

            {/* Hearts (left bottom) */}
            <div className="hearts-container">
                {[...Array(5)].map((_, index) => (
                    <img key={index} src={Heart || "/placeholder.svg"} alt="Heart" className="heart-image" />
                ))}
            </div>

            {/* Doge character (right) */}
            <div className="doge-container">
                <img src={Doge || "/placeholder.svg"} alt="Doge" className="doge-image" />
            </div>

            {/* Diamonds (right bottom) */}
            <div className="diamond-container">
                {[...Array(5)].map((_, index) => (
                    <img key={index} src={Diamond || "/placeholder.svg"} alt="Diamond" className="diamond-image" />
                ))}
            </div>

            {/* Pixel art ground/bushes */}
            <div className="bushes-container">
                <img src={Bushes_desktop || "/placeholder.svg"} alt="Pixel Art Ground" />
            </div>
        </div>
    )
}

export default HomeLogo
