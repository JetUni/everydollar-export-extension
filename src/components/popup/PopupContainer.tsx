import Section from '@root/src/components/Section';
import SpinnerWithText from '@root/src/components/SpinnerWithText';
import Text from '@root/src/components/Text';
import DefaultButton from '@root/src/components/button/DefaultButton';
import DownloadTransactions from '@root/src/components/popup/DownloadTransactions';
import { ResponseStatus } from '@root/src/pages/popup/Popup';
import { usePopupContext } from '@root/src/pages/popup/context';
import { Action, useMessageSender } from '@root/src/shared/hooks/useMessage';
import useStorage from '@root/src/shared/hooks/useStorage';
import budgetStorage, { PageKey } from '@root/src/shared/storages/budgetStorage';
import React, { useCallback, useMemo } from 'react';

interface Page {
  title: string;
  component: React.ElementType;
}

const PAGE_TO_COMPONENT: Record<PageKey, Page> = {
  downloadBudgets: {
    title: 'Everydollar Budgets',
    component: DownloadTransactions,
  },
};

const PopupContainer = ({ children }: React.PropsWithChildren) => {
  const { currentPage, downloadBudgetsStatus } = useStorage(budgetStorage);
  const { status, userData } = usePopupContext();
  const sendMessage = useMessageSender();

  const onDownloadBudgets = useCallback(async () => {
    const { downloadBudgetsStatus } = await budgetStorage.get();
    if (downloadBudgetsStatus === ResponseStatus.Loading) {
      await budgetStorage.patch({
        currentPage: 'downloadBudgets',
      });
      return;
    }
    await budgetStorage.patch({
      currentPage: 'downloadBudgets',
      downloadBudgetsStatus: ResponseStatus.Loading,
      totalBudgetsCount: undefined,
    });
    const result = await sendMessage<{ count?: number }>({ action: Action.DownloadBudgets });
    if (result?.count) {
      await budgetStorage.patch({
        downloadBudgetsStatus: ResponseStatus.Success,
        totalBudgetsCount: result.count,
      });
    } else {
      await budgetStorage.patch({ downloadBudgetsStatus: ResponseStatus.Error });
    }
  }, [sendMessage]);

  const content = useMemo(() => {
    switch (status) {
      case ResponseStatus.Loading:
        return <SpinnerWithText>Loading your information...</SpinnerWithText>;
      case ResponseStatus.RequireAuth:
      case ResponseStatus.Error:
        return (
          <div className="flex flex-col gap-2 text-center">
            <Text type="subtitle" className="block">
              Open Everydollar Dashboard
            </Text>
            <Text className="font-medium">
              We couldn&apos;t get your Everydollar user information. Please ensure you have a tab
              with the Everydollar dashboard open and try opening the extension again.
            </Text>
            <DefaultButton href="https://everydollar.com/app/budget">
              Go to Everydollar dashboard
            </DefaultButton>
          </div>
        );
      case ResponseStatus.Success:
        return (
          <div className="flex flex-col gap-2 text-center">
            <Text type="subtitle">Logged in to Everydollar</Text>
            <Text type="header">{userData?.email}</Text>
            <DefaultButton onClick={onDownloadBudgets}>
              Download Everydollar budget history
            </DefaultButton>
          </div>
        );
      default:
        return (
          <div className="p-large text-center">
            Unknown state. Please try opening the extension again.
          </div>
        );
    }
  }, [status, userData, onDownloadBudgets]);

  const { component: PageComponent, title: pageTitle } = PAGE_TO_COMPONENT[currentPage] ?? {};

  // 💀
  const showBackArrow =
    currentPage === 'downloadBudgets'
      ? downloadBudgetsStatus !== ResponseStatus.Loading
      : !!currentPage; // there's a page that's not index (index is undefined)

  // Make sure it's actually running
  if (currentPage === 'downloadBudgets') {
    setTimeout(async () => {
      const { downloadBudgetsStatus } = await budgetStorage.get();
      if (downloadBudgetsStatus === ResponseStatus.Loading) {
        await budgetStorage.patch({
          downloadBudgetsStatus: ResponseStatus.Error,
        });
      }
    }, 30_000);
  }

  return (
    <div className="flex flex-col">
      <Section
        className="border-b-0 bg-greenSpecial"
        left={
          showBackArrow && (
            <button onClick={() => budgetStorage.patch({ currentPage: undefined })}>
              <Text type="header" className="text-white">
                ←
              </Text>
            </button>
          )
        }>
        <Text type="header" className="text-white">
          {pageTitle ?? 'Everydollar Data Exporter'}
        </Text>
      </Section>
      {PageComponent ? (
        <PageComponent />
      ) : (
        <div>
          <div className="p-large">{content}</div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default PopupContainer;
