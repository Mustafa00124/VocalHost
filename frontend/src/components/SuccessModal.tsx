import { useTheme } from '../contexts/ThemeContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import { motion } from 'framer-motion';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

const SuccessModal = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'Continue',
}: SuccessModalProps) => {
  const { theme } = useTheme();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
      <div className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex justify-center"
        >
          <CheckCircleIcon className={`w-16 h-16 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
        </motion.div>
        
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
          {message}
        </p>
        
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {buttonText}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default SuccessModal; 