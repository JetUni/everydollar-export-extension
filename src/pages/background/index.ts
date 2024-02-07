import { ResponseStatus } from '@root/src/pages/popup/Popup';
import { ErrorCode } from '@root/src/shared/constants/error';
import { Action } from '@root/src/shared/hooks/useMessage';
import { fetchAllBudgets, fetchBudgetList } from '@root/src/shared/lib/budgets';
import budgetStorage from '@root/src/shared/storages/budgetStorage';
import userDataStorage from '@src/shared/storages/authStorage';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

// const THROTTLE_INTERVAL_MS = 200;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab?.url.startsWith('chrome://')) {
    return true;
  }

  if (message.action === Action.PopupOpened) {
    console.log('Popup opened');
    handlePopupOpened(sendResponse);
  } else if (message.action === Action.GetEverydollarUserToken) {
    console.log('message received to get everydollar user token');
    handleEverydollarAuthentication(sendResponse);
  } else if (message.action === Action.DownloadBudgets) {
    handleBudgetsDownload(sendResponse);
  } else if (message.action === Action.DebugThrowError) {
    throw new Error('Debug error');
  } else {
    console.warn(`Unknown action: ${message.action}`);
  }

  return true; // indicates we will send a response asynchronously
});

const handlePopupOpened = async (sendResponse: (args: unknown) => void) => {
  const userData = await userDataStorage.get();

  await budgetStorage.clear();

  if (userData) {
    sendResponse({ status: ResponseStatus.Success, userData });
  } else {
    sendResponse({ status: ResponseStatus.RequireAuth });
  }
};

const handleEverydollarAuthentication = async (sendResponse: (args: unknown) => void) => {
  const [activeEverydollarTab] = await chrome.tabs.query({
    active: true,
    url: 'https://www.everydollar.com/*',
  });
  console.log('Everydollar active tab?', activeEverydollarTab);
  // console.log('chrome tabs query response', await chrome.tabs.query({}));

  // No active Everydollar tab, return early
  if (!activeEverydollarTab) {
    sendResponse({ success: false, error: ErrorCode.EverydollarTabNotFound });
    return;
  }

  // Get the API key from the page
  console.log('about to run chrome scripting');
  const response = await chrome.scripting.executeScript({
    target: { tabId: activeEverydollarTab.id },
    world: 'MAIN',
    func: getUserData,
  });
  console.log('chrome scripting response', response);

  const [{ result: userData }] = response;

  console.log('userData', userData);
  if (userData?.userToken) {
    await userDataStorage.set(userData);
    sendResponse({ success: true, userData });
  } else {
    sendResponse({ success: false, error: ErrorCode.EverydollarUserTokenNotFound });
  }
};

function getUserData() {
  return window.userData;
}

const handleBudgetsDownload = async (sendResponse: (args: unknown) => void) => {
  const budgetList = await fetchBudgetList();

  await fetchAllBudgets(budgetList);
  // const csvContent = concatenateCSVPages(pages);

  // await chrome.downloads.download({
  //   url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
  //   filename: 'mint-transactions.csv',
  // });

  // // Update state in the background, in case the user closes the popup before the download completes
  // await stateStorage.patch({
  //   totalTransactionsCount: totalBudgetsCount,
  //   downloadTransactionsStatus: ResponseStatus.Success,
  // });

  sendResponse({ success: true, count: budgetList.length });
};

/**
 * Download all daily balances for all account. Since this is an operation that
 * may take a while, we will send progress updastes to the popup.
 */
// const handleDownloadAllAccountBalances = async (sendResponse: () => void) => {
//   try {
//     const throttledSendDownloadBalancesProgress = throttle(
//       sendDownloadBalancesProgress,
//       THROTTLE_INTERVAL_MS,
//     );

//     const balancesByAccount = await fetchDailyBalancesForAllAccounts({
//       onProgress: throttledSendDownloadBalancesProgress,
//     });

//     const successAccounts = balancesByAccount.filter(({ balances }) => balances.length > 0);
//     const errorAccounts = balancesByAccount.filter(({ balances }) => balances.length === 0);

//     // combine CSV for each account into one zip file
//     const zip = new JSZip();
//     const seenAccountNames = {};
//     successAccounts.forEach(({ accountName, fiName, balances }) => {
//       const seenCount = (seenAccountNames[accountName] = (seenAccountNames[accountName] || 0) + 1);
//       // If there are multiple accounts with the same name, export both with distinct filenames
//       const disambiguation = seenCount > 1 ? ` (${seenCount - 1})` : '';
//       zip.file(
//         `${accountName}${disambiguation}-${fiName}.csv`,
//         formatBalancesAsCSV(balances, accountName),
//       );
//     });

//     const zipFile = await zip.generateAsync({ type: 'base64' });

//     chrome.downloads.download({
//       url: `data:application/zip;base64,${zipFile}`,
//       filename: 'mint-balances.zip',
//     });

//     await accountStorage.patch({
//       status: AccountsDownloadStatus.Success,
//       successCount: successAccounts.length,
//       errorCount: errorAccounts.length,
//     });
//   } catch (e) {
//     await accountStorage.patch({ status: AccountsDownloadStatus.Error });
//   } finally {
//     sendResponse();
//   }
// };

/**
 * Updates both the state storage and sends a message with the current progress,
 * so the popup can update the UI and we have a state to restore from if the
 * popup is closed.
 */
// const sendDownloadBalancesProgress = async (payload: BalanceHistoryCallbackProgress) => {
//   await accountStorage.patch({ progress: payload });
// };
