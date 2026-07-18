const values = new Map<string, string>();

const AsyncStorage = {
  getItem: async (key: string) => values.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    values.set(key, value);
  },
  clear: async () => {
    values.clear();
  },
};

export default AsyncStorage;
