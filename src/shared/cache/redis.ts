import { createClient } from "redis";

const client = createClient();

export const initConnection = () => client.connect();
export const closeConnection = () => client.disconnect();
export const cacheItem = (key: string, item: any, expiresIn = 0) => {
  return new Promise<string | null>((resolve, reject) => {
    client
      .set(key, typeof item === "string" ? item : JSON.stringify(item))
      .then(val => {
        if (expiresIn > 0) {
          client
            .expire(key, expiresIn * 60)
            .then(() => {
              resolve(val);
            })
            .catch(reject);
        } else {
          resolve(val);
        }
      })
      .catch(reject);
  });
};
export const hCacheItem = (key: string, field: string, item: object) => {
  return new Promise<number>((resolve, reject) => {
    client
      .hSet(key, field, JSON.stringify({ ...item }))
      .then(resolve)
      .catch(reject);
  });
};
export const hReadItems = (key: string) => {
  return new Promise<{ [x: string]: string }>((resolve, reject) => {
    client.hGetAll(key).then(resolve).catch(reject);
  });
};
export const readItem = (key: string) => {
  return new Promise<string | null>((resolve, reject) => {
    client.get(key).then(resolve).catch(reject);
  });
};
export const deleteItem = (key: string) => {
  return new Promise<number>((resolve, reject) => {
    client.del(key).then(resolve).catch(reject);
  });
};

export const itemExists = (key: string) => {
  return new Promise<boolean>((resolve, reject) => {
    client
      .exists(key)
      .then(val => resolve(val === 1))
      .catch(reject);
  });
};
export const getAllKeysMatching = (pattern: string) => {
  return new Promise<Array<string>>((resolve, reject) => {
    client.keys(pattern).then(resolve).catch(reject);
  });
};
