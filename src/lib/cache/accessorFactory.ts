export type ForceMiss<T, K extends keyof T> = (key: K) => Promise<T[K]>;
export type Update<T, K extends keyof T> = (key: K, value: T[K]) => Promise<void>;
export type Get<T, K extends keyof T> = (key: K) => T[K];
export type Set<T, K extends keyof T> = (key: K, value: T[K]) => T[K];

export interface ConfAccessor<T, K extends keyof T>{
  cached: () => T[K],
  forceMiss: () => Promise<T[K]>,
  set: (value: T[K]) => T[K],
  update?: (value: T[K]) => Promise<T[K]>,
}

export const accessorFactory =
  <T>({
    get,
    set,
    forceMiss,
    update,
  }: {
    get: Get<T, keyof T>;
    set: Set<T, keyof T>;
    forceMiss: ForceMiss<T, keyof T>;
    update?: Update<T, keyof T>;
  }) =>
  <K extends keyof T>(uuid: K): { [P in keyof T & K]: ConfAccessor<T, K> } =>
    ({
      [uuid]: {
        // 📌 unfiled/5N4oujGYPrbzwSF8Ww6qEn.md 📝 🗑
        /** return cached value */
        cached: () => get(uuid),
        /** force cache miss and rerun underlying data access */
        forceMiss: async () => set(uuid, await forceMiss(uuid)),
        /** set cached value but do not send update request to data source */
        set: (value: T[K]) => set(uuid, value),
        /** request to update data source*/
        update: async (value: T[K]) => {
          if (update) {
            await update(uuid, value);
          }
          return set(uuid, value);
        },
      },
    } as any);

