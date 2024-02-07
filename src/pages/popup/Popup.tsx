import ErrorBoundary from '@root/src/components/ErrorBoundary';
import Text from '@root/src/components/Text';
import DefaultButton from '@root/src/components/button/DefaultButton';
import PopupContext from '@root/src/pages/popup/context';
import budgetStorage from '@root/src/shared/storages/budgetStorage';
import PopupContainer from '@src/components/popup/PopupContainer';
import { ErrorCode } from '@src/shared/constants/error';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';
import { Action, useMessageSender } from '@src/shared/hooks/useMessage';
import userDataStorage, { UserData } from '@src/shared/storages/authStorage';
import { useEffect, useMemo, useState } from 'react';

export enum ResponseStatus {
  RequireAuth = 'require_auth',
  Error = 'error',
  Success = 'success',
  Loading = 'loading',
}

const Popup = () => {
  const [showBrokenComponent, setShowBrokenComponent] = useState(false);
  const sendMessage = useMessageSender();

  const [status, setStatus] = useState<ResponseStatus>(ResponseStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  const [userData, setUserData] = useState<UserData>(undefined);

  useEffect(() => {
    if (status === ResponseStatus.Loading) {
      handlePopupOpened();
    }
  }, [status]);

  const resetExtensionState = async () => {
    await userDataStorage.clear();
    await budgetStorage.clear();
    setUserData(null);
    setStatus(ResponseStatus.Loading);
  };

  const handlePopupOpened = async () => {
    const response = await sendMessage<{ status: ResponseStatus; userData?: UserData }>({
      action: Action.PopupOpened,
    });
    console.log('handle popup opened response', response);

    if (!response) {
      setStatus(ResponseStatus.Error);
      return;
    }

    const { status } = response;
    if (status === ResponseStatus.RequireAuth) {
      authenticateOnDashboard();
    } else {
      setStatus(ResponseStatus.Success);
    }
  };

  const authenticateOnDashboard = async () => {
    try {
      console.log('sending message to get everydollar user token');
      const response = await sendMessage<{ success: boolean; apiKey?: string; error?: ErrorCode }>({
        action: Action.GetEverydollarUserToken,
      });

      console.log('everydollar user token response', response);
      setStatus(ResponseStatus.Success);
    } catch ({ error }) {
      if (error === ErrorCode.EverydollarTabNotFound) {
        // User hasn't opened the popup in the dashboard, show message
        setStatus(ResponseStatus.RequireAuth);
      } else if (error === ErrorCode.EverydollarUserTokenNotFound) {
        // User is not logged into Mint, show message to open Mint and login
        setStatus(ResponseStatus.Error);
        setErrorMessage('Please login to Mint and open this popup again.');
      }
    }
  };

  const context = useMemo(
    () => ({ status, errorMessage, userData }),
    [status, errorMessage, userData],
  );

  return (
    <PopupContext.Provider value={context}>
      <PopupContainer>
        {import.meta.env.DEV && (
          <div className="flex flex-col gap-2 border-b border-t border-dashed border-grayLight bg-grayLightBackground p-large">
            <Text type="subtitle" className="text-center">
              🔨 Debugging Tools
            </Text>
            <DefaultButton onClick={resetExtensionState}>Reset API key state</DefaultButton>
            <DefaultButton onClick={() => setShowBrokenComponent(true)}>Throw error</DefaultButton>
            <DefaultButton onClick={() => sendMessage({ action: Action.DebugThrowError })}>
              Throw error in service worker
            </DefaultButton>
            {showBrokenComponent && <BrokenComponent />}
          </div>
        )}
      </PopupContainer>
    </PopupContext.Provider>
  );
};

const BrokenComponent = () => {
  throw new Error('Broken component');
};

export default withErrorBoundary(withSuspense(Popup, <div>Loading...</div>), <ErrorBoundary />);
