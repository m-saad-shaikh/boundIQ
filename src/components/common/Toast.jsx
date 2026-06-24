import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] min-w-[300px]"
        >
          <div className={`glass-premium rounded-2xl p-4 border flex items-center gap-4 ${
            type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {type === 'success' ? (
                <CheckCircle2 size={20} className="text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</p>
              <p className="text-white/60 text-xs">{message}</p>
            </div>

            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
