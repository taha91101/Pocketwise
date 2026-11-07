module.exports = {
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(async () => undefined),
    runAsync: jest.fn(async () => ({ changes: 1 })),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => ({ count: 0 })),
    withTransactionAsync: jest.fn(async (cb) => cb()),
  })),
};

