'use client'
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import '../globals.css'

export default function Raindrop({count=127}:{count:number}){
    const [drops, setDrops] = useState<{ left: number; delay: number; duration: number; size: number; depth: number }[]>([]);
    
    useEffect(() => {
        const zScales = [1.8, 1.6, 1.4, 1.2];
        const newDrops = Array.from({ length: count }).map(() => {
        const depth = zScales[Math.floor(Math.random() * zScales.length)];
        return {
            left: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 0.81 + Math.random() * 1.5,
            size: 4 + Math.random() * 4,
            depth,
        };
        });
        setDrops(newDrops);
    }, [count]);

    return(
    <>
        <div className="h-full w-full flex items-center justify-center">
            {drops.map((drop, i) => {
                const opacity = drop.depth / 2;
                return (
                <img
                    key={i}
                    src={`/bg_img/raindrop.png`}
                    className={`absolute rounded-full animate-fall`}
                    style={{
                        zIndex: drop.depth,
                        left: `${drop.left}%`,
                        top: `-10px`,
                        width: `${drop.size}px`,
                        height: `${drop.size}px`,
                        animationDelay: `${drop.delay}s`,
                        animationDuration: `${drop.duration}s`,
                        filter: `blur(${1.8 - drop.depth}px)`,
                        opacity,
                        '--scale': drop.depth,
                    } as React.CSSProperties}
                />
                );
            })}
        </div>
    </>
    );
}