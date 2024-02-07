import { useCallback, useEffect, useRef } from 'react';

export enum Action {
  PopupOpened = 'POPUP_OPENED',
  GetEverydollarUserToken = 'GET_EVERYDOLLAR_USER_TOKEN',
  // Sent by the button in the popup to start downloading budgets
  RequestBudgetsDownload = 'REQUEST_BUDGETS_DOWNLOAD',
  DownloadBudgets = 'DOWNLOAD_BUDGETS',
  // Debug actions
  DebugThrowError = 'DEBUG_THROW_ERROR',
}

type Message = { action: Action; payload?: Record<string, unknown> };

export const useMessageListener = <TPayload extends Record<string, unknown>>(
  action: Action,
  callback: (payload: TPayload) => void | Promise<void>,
) => {
  const listenerRef = useRef<(message: Message, sender: unknown, sendResponse: unknown) => void>();

  useEffect(() => {
    if (listenerRef.current) {
      return;
    }

    // Create a new listener
    listenerRef.current = async (message) => {
      if (message.action === action) {
        // eslint-disable-next-line no-prototype-builtins
        if (callback.hasOwnProperty('then')) {
          await callback(message.payload as TPayload);
        } else {
          callback(message.payload as TPayload);
        }
      }

      return true;
    };

    chrome.runtime.onMessage.addListener(listenerRef.current);

    return () => {
      chrome.runtime.onMessage.removeListener(listenerRef.current);
    };
  }, [action, callback]);
};

export const useMessageSender = () => {
  const sendMessage = useCallback(
    <T extends Record<string, unknown>>(message: Message) =>
      new Promise<T>((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response: T) => {
          if (response?.error) {
            reject(response);
            return;
          }

          resolve(response);
        });
      }),
    [],
  );

  return sendMessage;
};
