const store = new Map();

module.exports = {
  getItemAsync: jest.fn(async (key) => {
    return store.has(key) ? store.get(key) : null;
  }),
  setItemAsync: jest.fn(async (key, value) => {
    store.set(key, String(value));
    return;
  }),
  deleteItemAsync: jest.fn(async (key) => {
    store.delete(key);
    return;
  }),
};

