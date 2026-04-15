"use client";

import { motion } from "motion/react";

interface HandWrittenTitleProps {
    title?: string;
    subtitle?: string;
}

function HandWrittenTitle({
    title = "Hand Written",
    subtitle = "Optional subtitle",
}: HandWrittenTitleProps) {
    const draw = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96] },
                opacity: { duration: 0.5 },
            },
        },
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto py-24">
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.svg
                    width="110%"
                    height="110%"
                    viewBox="0 0 1200 500"
                    initial="hidden"
                    animate="visible"
                    className="absolute"
                    style={{ overflow: 'visible' }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <title>Circle Animation</title>
                    <motion.path
                        d="M 1050 60
                           C 1180 60, 1200 140, 1190 250
                           C 1180 370, 1100 460, 900 470
                           C 700 480, 400 480, 250 460
                           C 80 440, 0 370, 5 250
                           C 10 130, 80 50, 280 40
                           C 480 30, 750 30, 900 40
                           C 980 45, 1030 55, 1050 60"
                        fill="none"
                        strokeWidth="10"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        variants={draw}
                        className="text-black dark:text-white opacity-80"
                    />
                </motion.svg>
            </div>
            <div className="relative text-center z-10 flex flex-col items-center justify-center">
                <motion.h1
                    className="text-4xl md:text-6xl text-black dark:text-white tracking-tighter flex items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    {title}
                </motion.h1>
                {subtitle && (
                    <motion.p
                        className="text-xl text-black/80 dark:text-white/80 mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    >
                        {subtitle}
                    </motion.p>
                )}
            </div>
        </div>
    );
}

export { HandWrittenTitle };
