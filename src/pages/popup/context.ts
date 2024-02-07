import { ResponseStatus } from '@root/src/pages/popup/Popup';
import { UserData } from '@root/src/shared/storages/authStorage';
import { createContext, useContext } from 'react';

const PopupContext = createContext<{
  status: ResponseStatus;
  errorMessage?: string;
  userData?: UserData;
}>(undefined);

export const usePopupContext = () => {
  const context = useContext(PopupContext);

  if (!context) {
    throw new Error('usePopupContext must be used within PopupContext.Provider');
  }

  return context;
};

export default PopupContext;
