import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { exportToPDF } from '../../utils/exportUtils';

/**
 * Premium Neon Export Button Component
 * @param {string} targetId - ID of the element to export
 * @param {string} filename - Custom filename
 */
const ExportButton = ({ targetId = 'report', filename = 'relationship-report.pdf' }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleExport = async () => {
    if (status === 'loading') return;
    
    setStatus('loading');
    try {
      await exportToPDF(targetId, filename);
      setStatus('success');
      // Reset back to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleExport}
        disabled={status === 'loading'}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-xl font-display font-bold text-xs overflow-hidden transition-all duration-300 h-10
          ${status === 'loading' ? 'cursor-wait opacity-80' : 'cursor-pointer'}
          ${status === 'error' ? 'border-red-500/50 text-red-400' : 'text-white/70 hover:text-white'}
          glass border border-white/10 group uppercase tracking-wider
        `}
      >
        {/* Subtle Glow on Hover */}
        <div className={`
          absolute inset-0 -z-10 transition-opacity duration-500
          bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100
        `} />
        
        {/* State Indicators */}
        <AnimatePresence mode="wait">
          {status === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Loader2 size={14} />
            </motion.div>
          ) : status === 'success' ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-emerald-400"
            >
              <CheckCircle size={14} />
            </motion.div>
          ) : status === 'error' ? (
            <motion.div
              key="error"
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              className="text-red-400"
            >
              <AlertCircle size={14} />
            </motion.div>
          ) : (
            <motion.div key="idle">
              <FileDown size={14} className="text-purple-400 group-hover:text-white transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
 
        <span className="relative z-10 hidden sm:inline">
          {status === 'loading' ? 'Exporting...' : 
           status === 'success' ? 'Saved!' :
           status === 'error'   ? 'Failed' : 'PDF Report'}
        </span>
      </motion.button>

      {/* Success/Error Toast Notification (Simplified) */}
      <AnimatePresence>
        {(status === 'success' || status === 'error') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`
              absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50
              ${status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}
              backdrop-blur-md
            `}
          >
            {status === 'success' ? 'High Quality PDF Generated' : 'Something went wrong'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportButton;
