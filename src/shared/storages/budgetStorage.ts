import { ResponseStatus } from '@root/src/pages/popup/Popup';
import { createStorage, StorageType } from '@src/shared/storages/base';

export type PageKey = 'downloadBudgets';

type State = {
  currentPage: PageKey | undefined;
  downloadBudgetsStatus: ResponseStatus;
  totalBudgetsCount: number;
};

const budgetStorage = createStorage<State>(
  'state-storage',
  {
    currentPage: undefined,
    downloadBudgetsStatus: undefined,
    totalBudgetsCount: undefined,
  },
  {
    storageType: StorageType.Local,
  },
);

export default budgetStorage;
