import { keys } from "../../utils/utils";

export type Cache<T> = {
  get: <K extends keyof T>(uuid: K) => T[K],
  set: <K extends keyof T>(uuid: K, item: T[K]) => T[K],
  delete: <K extends keyof T>(uuid: K) => void,
  keys: () => (keyof T)[]
};

export function getCacheFactory<T>() {
  const cache: any = {};
  return function(): Cache<T> {
    return {
      delete: (uuid) => delete cache[uuid],
      set: (uuid, item) => cache[uuid] = item,
      get: (uuid)=> cache[uuid],
      keys: () => keys(cache) as any,
    }
  }
};