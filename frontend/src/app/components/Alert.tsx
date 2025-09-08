'use client'
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Orbitron, MonteCarlo } from "next/font/google";

const orb = Orbitron({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function Alert({message, ok, cancel, onClose}: {message: string; ok: boolean; cancel?: boolean; onClose?: (confirmed: boolean) => void;}){
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!ok && !cancel) {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.(false);
        }, 1500);
        return () => clearTimeout(timer);
        }
    }, [ok, cancel, onClose]);

    const handleClose = (result: boolean) => {
        setVisible(false);
        onClose?.(result);
    };
      
    if (!visible) return null;
    return(
        <div className="z-[10000] fixed top-0 right-0 bottom-0 left-0 h-[100vh] w-screen flex items-center justify-center">
            <img src={`/bg_noise/water-5.png`} alt="" className="absolute z-[9999] w-full h-full object-cover opacity-[0.54]"/>

            <div className="z-[10000] relative h-full w-full flex items-start justify-center pt-[1vh]">
                <div className="relative z-[10001] h-[27vh] w-[54vw] flex items-center justify-center">
                    <img src={`/bg_img/landingpage_parallax.png`} alt="" className="absolute z-[10000] rounded-xl w-full h-full object-cover"/>
                    <div className="relative z-[10001] h-[22vh] w-[47vw] flex flex-col items-center justify-center p-[1vh]">
                        <img src={`/bg_noise/water-5.png`} alt="" className="absolute z-[10000] rounded-xl w-full h-full object-cover opacity-[0.54]"/>
                        <span className={`${orb.className} h-[80%] w-full flex items-center justify-center text-[1.54vh] font-bold z-[10002] text-white`}>{message}</span>
                        <div className={`h-[20%] w-auto flex items-center justify-center ${orb.className} gap-[1vw]`}>
                            {ok && <motion.button onClick={() => handleClose(true)} whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="z-[10002] w-auto h-full flex items-center justify-center px-4 py-2 text-[1.54vh] text-water-5 font-bold rounded cursor-pointer"
                                style={{backgroundImage: "url('/bg_noise/water-1.png')", backgroundSize: 'cover'}}
                                >OK</motion.button>}
                            {cancel && <motion.button onClick={() => handleClose(false)} whileHover={{ scale: 1.054 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="z-[10002] w-auto h-full flex items-center justify-center px-4 py-2 text-[1.54vh] text-water-1 font-semibold rounded cursor-pointer"
                                style={{backgroundImage: "url('/bg_noise/water-5.png')", backgroundSize: 'cover'}}
                                >Cancel</motion.button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}