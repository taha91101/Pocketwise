module.exports = {
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default,
  },
  NativeModules: {
    UPITransactionDetectionModule: {
      isNotificationAccessGranted: jest.fn(() => Promise.resolve(true)),
      openNotificationAccessSettings: jest.fn(() => Promise.resolve(true)),
      isDetectionEnabled: jest.fn(() => Promise.resolve(true)),
      setDetectionEnabled: jest.fn(() => Promise.resolve(true)),
      isAutoConfirmEnabled: jest.fn(() => Promise.resolve(true)),
      setAutoConfirmEnabled: jest.fn(() => Promise.resolve(true)),
      getSupportedPaymentApps: jest.fn(() => Promise.resolve([])),
      getDetectedTransactions: jest.fn(() => Promise.resolve([])),
      confirmDetectedTransaction: jest.fn(() => Promise.resolve(true)),
      rejectDetectedTransaction: jest.fn(() => Promise.resolve(true)),
      clearDetectedTransactions: jest.fn(() => Promise.resolve(true)),
      simulateTestNotification: jest.fn(() => Promise.resolve({})),
    },
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  })),
};
