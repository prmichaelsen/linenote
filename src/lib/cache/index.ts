import { ForceMiss, Update, accessorFactory } from "./accessorFactory";
import { getCacheFactory } from "./getCacheFactory";

export const initCache = <T>({
  forceMiss,
  update,
}: {
  forceMiss: ForceMiss<T, keyof T>,
  update?: Update<T, keyof T>,
}) => {
  const _getCache = getCacheFactory<T>();

  const cacheAccessorFactory = accessorFactory<T>({
    get: (uuid) => _getCache().get(uuid),
    set: (uuid, item) => _getCache().set(uuid, item),
    forceMiss,
    update,
  });
  
  return cacheAccessorFactory;
}