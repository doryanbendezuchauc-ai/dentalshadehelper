import { motion } from "motion/react";
import type { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    hoverGlow?: boolean;
}

function GlassCard({ children, className = "", delay = 0, hoverGlow = true }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
            className={`
                relative rounded-[28px] overflow-hidden
                bg-white/70 dark:bg-white/[0.04]
                backdrop-blur-2xl
                border border-white/30 dark:border-white/[0.06]
                shadow-[0_8px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)]
                transition-all duration-500
                ${hoverGlow ? "hover:shadow-[0_8px_60px_rgba(0,113,227,0.12)] dark:hover:shadow-[0_8px_60px_rgba(64,156,255,0.1)] hover:border-[#0071E3]/20 dark:hover:border-[#409CFF]/20" : ""}
                ${className}
            `}
        >
            {/* Top highlight edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
            {children}
        </motion.div>
    );
}

export { GlassCard };
