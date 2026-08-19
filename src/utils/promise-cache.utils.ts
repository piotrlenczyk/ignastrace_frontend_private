export const createPromiseCache = <Key extends object, Value>() => {
  const cache = new Map<string, Promise<Value>>();

  const get = (key: Key, create: () => Promise<Value>) => {
    const serializedKey = JSON.stringify(key);
    const cachedPromise = cache.get(serializedKey);

    if (cachedPromise) {
      return cachedPromise;
    }

    const promise = create().catch((error) => {
      cache.delete(serializedKey);
      throw error;
    });

    cache.set(serializedKey, promise);
    return promise;
  };

  return { get };
};
