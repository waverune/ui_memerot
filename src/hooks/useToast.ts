import { toast, ToastOptions } from 'react-toastify';

export const useToast = () => {
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', options?: ToastOptions) => {
    toast[type](message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options
    });
  };

  return { showToast };
};