import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const modalRoot = useRef<HTMLElement | null>(null);

  useEffect(() => {
    modalRoot.current = document.getElementById('modal-root');
    if (!modalRoot.current) {
      const div = document.createElement('div');
      div.id = 'modal-root';
      document.body.appendChild(div);
      modalRoot.current = div;
    }
  }, []);

  if (!isOpen || !modalRoot.current) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background layer */}
      <div className="absolute inset-0 bg-opacity-6"></div>
      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    modalRoot.current
  );
};

export default Modal;