import { motion } from "framer-motion";

export default function Customize() {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r border border-green-700 cursor-pointer from-green-600/20 to-green-700/20 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            
            {/* Button text */}
            <span className="relative z-10 text-sm">Customize</span>
        </motion.button>
    );
}