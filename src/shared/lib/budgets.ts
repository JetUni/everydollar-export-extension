import { makeEverydollarApiRequest } from '@root/src/shared/lib/auth';
import { DATE_FILTER_ALL_TIME, MINT_HEADERS } from '@root/src/shared/lib/constants';
import { withRetry } from '@root/src/shared/lib/retry';

/** Either due to a bug or something else, this is the maximum number of transactions
 * Mint will return from the download endpoint in CSV format. */
const MINT_MAX_TRANSACTIONS_DOWNLOAD = 10000;

const DATE_SORT = 'DATE_DESCENDING';

interface BudgetsListApiResponse {
  _embedded: {
    budget: {
      /**
       * @description A year-month-day formatted date string. Day is always 01
       * @example 2024-12-01
       */
      date: string;
      _links: {
        self: {
          /**
           * @description An urn formatted string
           * @example "urn:everydollar:budget:12345678-9012-3456-7890-123456789012"
           */
          href: string;
        };
      };
    }[];
  };
}

type BudgetsListApiBudget = BudgetsListApiResponse['_embedded']['budget'][0];

interface BudgetsResponse extends Pick<BudgetsListApiBudget, 'date'> {
  /**
   * @description The id of the budget in UUID form
   */
  id: string;
}

type BudgetGroupType = 'income' | 'expense' | 'debt';

type BudgetCategoryType = 'income' | 'expense' | 'sinking_fund' | 'debt';

type Currency = 'usd' | string;

interface BudgetApiResponse {
  currency: Currency;
  date: string;
  _embedded: {
    'budget-group': Array<{
      label: string;
      type: BudgetGroupType;
      _embedded: {
        'budget-item': Array<{
          amount_budgeted: { [key: Currency]: number };
          label: string;
          note?: string;
          type: BudgetCategoryType;
          _embedded: {
            allocation: Array<{
              amount: { [key: Currency]: number };
              date: string;
              label: string;
              merchant: string;
              whole: boolean;
            }>;
          };
        }>;
      };
    }>;
  };
}

/**
 * Use internal Everydollar API to fetch a list of budgets for user.
 */
export const fetchBudgetList = async (overrideApiKey?: string): Promise<BudgetsResponse[]> => {
  const response = await makeEverydollarApiRequest<BudgetsListApiResponse>(
    '/budget/budgets',
    {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': 'chrome-extension://lklcjkenejelhehbbmlcaedhlbdnjlpo',
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
    overrideApiKey,
  );
  const json = await response.json();
  console.log(json);

  return json._embedded.budget.map((budget) => ({
    date: budget.date,
    id: budget._links.self.href.split(':').at(-1),
  }));
};

export const fetchAllBudgets = async (budgets: BudgetsResponse[]) => {
  const budget = budgets.at(-2);

  const response = await makeEverydollarApiRequest<BudgetApiResponse>(
    `/budget/budgets/${budget.id}`,
    {
      method: 'GET',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
  );
  const json = await response.json();
  console.log(json.date);
  return json;
};

/**
 * Use internal Mint API to fetch transactions CSV.
 * Returns a maximum of 10,000 transactions.
 */
export const fetchDownloadTransactionsPage = async ({
  limit = MINT_MAX_TRANSACTIONS_DOWNLOAD,
  offset = 0,
  overrideApiKey,
}: {
  limit?: number;
  offset?: number;
  overrideApiKey?: string;
}): Promise<string> => {
  const response = await makeEverydollarApiRequest<string>(
    '/pfm/v1/transactions/search/download',
    {
      method: 'POST',
      headers: MINT_HEADERS,
      body: JSON.stringify({
        limit,
        offset,
        searchFilters: [],
        dateFilter: DATE_FILTER_ALL_TIME,
        sort: DATE_SORT,
      }),
    },
    overrideApiKey,
  );

  return response.text();
};

/**
 * Use internal Mint API to fetch all transaction CSV pages.
 *
 * @returns list of CSV content, unmodified.
 */
export const fetchAllDownloadTransactionPages = async ({
  totalTransactionCount,
  pageSize = MINT_MAX_TRANSACTIONS_DOWNLOAD,
  overrideApiKey,
}: {
  totalTransactionCount: number;
  pageSize?: number;
  overrideApiKey?: string;
}): Promise<string[]> => {
  const pageCount = Math.ceil(totalTransactionCount / pageSize);

  return Promise.all(
    [...Array(pageCount).keys()].map((i) =>
      withRetry(
        () =>
          fetchDownloadTransactionsPage({
            limit: pageSize,
            offset: i * pageSize,
            overrideApiKey,
          }),
        {
          delayMs: 500,
        },
      ),
    ),
  );
};

/**
 * Join together multiple pages of CSV content. Removes the header row
 * from all pages except the first one to prevent duplication.
 */
export const concatenateCSVPages = (pages: string[]): string =>
  pages.reduce((acc, content, i) => {
    if (i === 0) {
      // keep CSV header row from first page
      return acc + content;
    }

    // for all other pages, remove first row
    const lines = content.split('\n');
    lines.splice(0, 1);
    const withoutFirstLine = lines.join('\n');

    return acc + withoutFirstLine;
  }, '');
