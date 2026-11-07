import { useAppStore } from '../store/useAppStore';
import { DEMO_ACCOUNTS, DEMO_SAVINGS_GOALS, DEMO_BUDGETS } from '../constants/initialData';
import { Transaction } from '../types';

const makeTx = (overrides: Partial<Omit<Transaction, 'id' | 'createdAt'>> = {}): Omit<Transaction, 'id' | 'createdAt'> => ({
  title: 'Test Tx',
  amount: 100,
  type: 'expense',
  categoryId: 'cat-food',
  categoryName: 'Food & Dining',
  categoryIcon: 'coffee',
  categoryColor: '#EF4444',
  date: new Date().toISOString(),
  time: '12:00',
  accountId: 'acc-bank-1',
  accountName: 'HDFC Salary Account',
  paymentMethod: 'UPI',
  ...overrides,
});

describe('useAppStore - Balance Mutation & Reversal Tests', () => {
  beforeEach(async () => {
    // Populate clean test state with standard accounts and goals
    useAppStore.setState({
      accounts: JSON.parse(JSON.stringify(DEMO_ACCOUNTS)),
      savingsGoals: JSON.parse(JSON.stringify(DEMO_SAVINGS_GOALS)),
      budgets: JSON.parse(JSON.stringify(DEMO_BUDGETS)),
      transactions: [],
    });
  });

  describe('Transaction Additions & Balance Impact', () => {
    it('debits account balance on expense transaction', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const initialBalance = account.balance;
      const expenseAmount = 250;

      await state.addTransaction(
        makeTx({
          title: 'Lunch',
          amount: expenseAmount,
          type: 'expense',
          accountId: account.id,
          accountName: account.name,
        })
      );

      const updatedAccount = useAppStore.getState().accounts.find((a) => a.id === account.id);
      expect(updatedAccount?.balance).toBe(initialBalance - expenseAmount);
    });

    it('credits account balance on income transaction', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const initialBalance = account.balance;
      const incomeAmount = 5000;

      await state.addTransaction(
        makeTx({
          title: 'Freelance Payout',
          amount: incomeAmount,
          type: 'income',
          accountId: account.id,
          accountName: account.name,
        })
      );

      const updatedAccount = useAppStore.getState().accounts.find((a) => a.id === account.id);
      expect(updatedAccount?.balance).toBe(initialBalance + incomeAmount);
    });

    it('debits account and credits savings goal on saving transaction with goalId', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const goal = state.savingsGoals[0];
      const initialAccBalance = account.balance;
      const initialGoalAmount = goal.currentAmount;
      const saveAmount = 1000;

      await state.addTransaction(
        makeTx({
          title: 'Emergency Fund Deposit',
          amount: saveAmount,
          type: 'saving',
          accountId: account.id,
          accountName: account.name,
          goalId: goal.id,
          goalName: goal.name,
        })
      );

      const updatedAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);
      const updatedGoal = useAppStore.getState().savingsGoals.find((g) => g.id === goal.id);

      expect(updatedAcc?.balance).toBe(initialAccBalance - saveAmount);
      expect(updatedGoal?.currentAmount).toBe(initialGoalAmount + saveAmount);
    });

    it('handles transfer transaction by debiting source and crediting destination', async () => {
      const state = useAppStore.getState();
      const fromAcc = state.accounts[0];
      const toAcc = state.accounts[1];
      const initialFrom = fromAcc.balance;
      const initialTo = toAcc.balance;
      const transferAmount = 750;

      await state.addTransaction(
        makeTx({
          title: `Transfer to ${toAcc.name}`,
          amount: transferAmount,
          type: 'transfer',
          accountId: fromAcc.id,
          accountName: fromAcc.name,
          destinationAccountId: toAcc.id,
          destinationAccountName: toAcc.name,
        })
      );

      const updatedFrom = useAppStore.getState().accounts.find((a) => a.id === fromAcc.id);
      const updatedTo = useAppStore.getState().accounts.find((a) => a.id === toAcc.id);

      expect(updatedFrom?.balance).toBe(initialFrom - transferAmount);
      expect(updatedTo?.balance).toBe(initialTo + transferAmount);
    });

    it('auto-creates a cash account when accounts list is empty', async () => {
      useAppStore.setState({ accounts: [] });
      const state = useAppStore.getState();

      const newTx = await state.addTransaction(
        makeTx({
          title: 'First Expense',
          amount: 100,
          type: 'expense',
          accountId: '',
          accountName: '',
        })
      );

      const currentState = useAppStore.getState();
      expect(currentState.accounts.length).toBe(1);
      expect(currentState.accounts[0].name).toBe('Cash');
      expect(currentState.accounts[0].balance).toBe(-100);
      expect(newTx.accountId).toBe(currentState.accounts[0].id);
    });
  });

  describe('Transaction Deletions & Reversal Tests', () => {
    it('reverses an expense transaction by crediting the account back', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const baselineBalance = account.balance;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Grocery Run',
          amount: 300,
          type: 'expense',
          accountId: account.id,
          accountName: account.name,
        })
      );

      expect(useAppStore.getState().accounts.find((a) => a.id === account.id)?.balance).toBe(baselineBalance - 300);

      // Reversal: Delete transaction
      const success = await useAppStore.getState().deleteTransaction(tx.id);
      expect(success).toBe(true);

      const revertedAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);
      expect(revertedAcc?.balance).toBe(baselineBalance);
      expect(useAppStore.getState().transactions.some((t) => t.id === tx.id)).toBe(false);
    });

    it('reverses an income transaction by debiting the account back', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const baselineBalance = account.balance;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Consulting Fee',
          amount: 1200,
          type: 'income',
          accountId: account.id,
          accountName: account.name,
        })
      );

      expect(useAppStore.getState().accounts.find((a) => a.id === account.id)?.balance).toBe(baselineBalance + 1200);

      // Reversal: Delete transaction
      const success = await useAppStore.getState().deleteTransaction(tx.id);
      expect(success).toBe(true);

      const revertedAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);
      expect(revertedAcc?.balance).toBe(baselineBalance);
    });

    it('reverses a goal-linked saving transaction restoring both account and goal balance', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const goal = state.savingsGoals[0];
      const baselineAcc = account.balance;
      const baselineGoal = goal.currentAmount;
      const amount = 500;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Goal Save',
          amount,
          type: 'saving',
          accountId: account.id,
          accountName: account.name,
          goalId: goal.id,
          goalName: goal.name,
        })
      );

      // Verify intermediate state
      expect(useAppStore.getState().accounts.find((a) => a.id === account.id)?.balance).toBe(baselineAcc - amount);
      expect(useAppStore.getState().savingsGoals.find((g) => g.id === goal.id)?.currentAmount).toBe(baselineGoal + amount);

      // Reversal: Delete transaction
      const success = await useAppStore.getState().deleteTransaction(tx.id);
      expect(success).toBe(true);

      expect(useAppStore.getState().accounts.find((a) => a.id === account.id)?.balance).toBe(baselineAcc);
      expect(useAppStore.getState().savingsGoals.find((g) => g.id === goal.id)?.currentAmount).toBe(baselineGoal);
    });

    it('reverses a transfer transaction restoring both source and destination balances', async () => {
      const state = useAppStore.getState();
      const fromAcc = state.accounts[0];
      const toAcc = state.accounts[1];
      const baselineFrom = fromAcc.balance;
      const baselineTo = toAcc.balance;
      const amount = 400;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Transfer to savings',
          amount,
          type: 'transfer',
          accountId: fromAcc.id,
          accountName: fromAcc.name,
          destinationAccountId: toAcc.id,
          destinationAccountName: toAcc.name,
        })
      );

      // Reversal: Delete transaction
      const success = await useAppStore.getState().deleteTransaction(tx.id);
      expect(success).toBe(true);

      expect(useAppStore.getState().accounts.find((a) => a.id === fromAcc.id)?.balance).toBe(baselineFrom);
      expect(useAppStore.getState().accounts.find((a) => a.id === toAcc.id)?.balance).toBe(baselineTo);
    });

    it('returns false when attempting to delete a non-existent transaction', async () => {
      const success = await useAppStore.getState().deleteTransaction('non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('Transaction Updates & Balance Re-application', () => {
    it('correctly re-calculates balances when updating expense amount', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const initialBalance = account.balance;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Dinner',
          amount: 200,
          type: 'expense',
          accountId: account.id,
          accountName: account.name,
        })
      );

      // Update amount from 200 to 350
      const updated = await useAppStore.getState().updateTransaction(tx.id, { amount: 350 });
      expect(updated).toBe(true);

      const finalAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);
      expect(finalAcc?.balance).toBe(initialBalance - 350);
    });

    it('correctly reverts old account and debits new account when switching accounts', async () => {
      const state = useAppStore.getState();
      const acc1 = state.accounts[0];
      const acc2 = state.accounts[1];
      const initial1 = acc1.balance;
      const initial2 = acc2.balance;
      const amount = 150;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Snacks',
          amount,
          type: 'expense',
          accountId: acc1.id,
          accountName: acc1.name,
        })
      );

      expect(useAppStore.getState().accounts.find((a) => a.id === acc1.id)?.balance).toBe(initial1 - amount);

      // Change transaction account from acc1 to acc2
      const updated = await useAppStore.getState().updateTransaction(tx.id, {
        accountId: acc2.id,
        accountName: acc2.name,
      });
      expect(updated).toBe(true);

      const final1 = useAppStore.getState().accounts.find((a) => a.id === acc1.id);
      const final2 = useAppStore.getState().accounts.find((a) => a.id === acc2.id);

      expect(final1?.balance).toBe(initial1); // fully restored
      expect(final2?.balance).toBe(initial2 - amount); // debited
    });

    it('correctly handles type switch from expense to income', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const initialBalance = account.balance;
      const amount = 500;

      const tx = await state.addTransaction(
        makeTx({
          title: 'Payment or Refund',
          amount,
          type: 'expense',
          accountId: account.id,
          accountName: account.name,
        })
      );

      // Switch to income
      await useAppStore.getState().updateTransaction(tx.id, {
        type: 'income',
        categoryName: 'Refund',
      });

      const finalAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);
      // Revert expense (+500) and apply income (+500) -> initial + 500
      expect(finalAcc?.balance).toBe(initialBalance + amount);
    });

    it('returns false when updating a non-existent transaction', async () => {
      const success = await useAppStore.getState().updateTransaction('ghost-id', { amount: 999 });
      expect(success).toBe(false);
    });
  });

  describe('Account Transfers & Goal Actions', () => {
    it('transferBetweenAccounts validates accounts and creates transaction', async () => {
      const state = useAppStore.getState();
      const fromAcc = state.accounts[0];
      const toAcc = state.accounts[1];
      const initFrom = fromAcc.balance;
      const initTo = toAcc.balance;

      const success = await state.transferBetweenAccounts(fromAcc.id, toAcc.id, 500, 'Test transfer');
      expect(success).toBe(true);

      const afterState = useAppStore.getState();
      expect(afterState.accounts.find((a) => a.id === fromAcc.id)?.balance).toBe(initFrom - 500);
      expect(afterState.accounts.find((a) => a.id === toAcc.id)?.balance).toBe(initTo + 500);

      const transferTx = afterState.transactions[0];
      expect(transferTx.type).toBe('transfer');
      expect(transferTx.amount).toBe(500);
      expect(transferTx.destinationAccountId).toBe(toAcc.id);
    });

    it('transferBetweenAccounts rejects negative or zero amounts', async () => {
      const state = useAppStore.getState();
      const fromAcc = state.accounts[0];
      const toAcc = state.accounts[1];

      expect(await state.transferBetweenAccounts(fromAcc.id, toAcc.id, 0)).toBe(false);
      expect(await state.transferBetweenAccounts(fromAcc.id, toAcc.id, -100)).toBe(false);
    });

    it('transferBetweenAccounts rejects invalid account IDs', async () => {
      const state = useAppStore.getState();
      const fromAcc = state.accounts[0];

      expect(await state.transferBetweenAccounts(fromAcc.id, 'invalid-target', 200)).toBe(false);
      expect(await state.transferBetweenAccounts('invalid-source', fromAcc.id, 200)).toBe(false);
    });

    it('contributeToGoal debits account, increases goal amount, and sets completed status', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const goal = state.savingsGoals[0];
      const needed = goal.targetAmount - goal.currentAmount;
      const initAcc = account.balance;

      const success = await state.contributeToGoal(goal.id, account.id, needed);
      expect(success).toBe(true);

      const afterGoal = useAppStore.getState().savingsGoals.find((g) => g.id === goal.id);
      const afterAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);

      expect(afterGoal?.currentAmount).toBe(goal.targetAmount);
      expect(afterGoal?.isCompleted).toBe(true);
      expect(afterAcc?.balance).toBe(initAcc - needed);
    });

    it('withdrawFromGoal credits account, decreases goal amount, and uncompletes if needed', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const goal = state.savingsGoals[0];

      // First make sure goal has funds
      await state.updateSavingsGoal(goal.id, { currentAmount: 1000, isCompleted: true });

      const initAcc = useAppStore.getState().accounts.find((a) => a.id === account.id)!.balance;

      const success = await useAppStore.getState().withdrawFromGoal(goal.id, account.id, 400);
      expect(success).toBe(true);

      const afterGoal = useAppStore.getState().savingsGoals.find((g) => g.id === goal.id);
      const afterAcc = useAppStore.getState().accounts.find((a) => a.id === account.id);

      expect(afterGoal?.currentAmount).toBe(600);
      expect(afterGoal?.isCompleted).toBe(false);
      expect(afterAcc?.balance).toBe(initAcc + 400);
    });

    it('withdrawFromGoal rejects withdrawals greater than available goal balance', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const goal = state.savingsGoals[0];

      const success = await state.withdrawFromGoal(goal.id, account.id, goal.currentAmount + 1000);
      expect(success).toBe(false);
    });
  });

  describe('Duplicate & Account Management', () => {
    it('duplicateTransaction creates a new transaction with same details and debits balance', async () => {
      const state = useAppStore.getState();
      const account = state.accounts[0];
      const initBal = account.balance;

      const original = await state.addTransaction(
        makeTx({
          title: 'Coffee',
          amount: 50,
          type: 'expense',
          accountId: account.id,
          accountName: account.name,
        })
      );

      expect(useAppStore.getState().accounts.find((a) => a.id === account.id)?.balance).toBe(initBal - 50);

      const duplicated = await useAppStore.getState().duplicateTransaction(original.id);
      expect(duplicated).not.toBeNull();
      expect(duplicated?.id).not.toBe(original.id);
      expect(duplicated?.title).toBe(original.title);
      expect(duplicated?.amount).toBe(50);

      expect(useAppStore.getState().accounts.find((a) => a.id === account.id)?.balance).toBe(initBal - 100);
    });

    it('addAccount and deleteAccount update account list and overview', async () => {
      const state = useAppStore.getState();
      const initialCount = state.accounts.length;

      const newAcc = await state.addAccount({
        name: 'Investment Pocket',
        type: 'investment',
        balance: 10000,
        icon: 'trending-up',
        color: '#6366F1',
      });

      expect(useAppStore.getState().accounts.length).toBe(initialCount + 1);

      await useAppStore.getState().deleteAccount(newAcc.id);
      expect(useAppStore.getState().accounts.length).toBe(initialCount);
    });
  });
});
