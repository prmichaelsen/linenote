import { workspace } from 'vscode';
import { initCache } from '../../cache';

export type CleanUpOrphanedNotesStrategy = 
  | 'on-save'
  | 'on-interval'
  | 'on-save-and-on-interval'
  | 'never'
  ;

export interface ConfigurationCache {
  removeText: string,
  editText: string,
  notePrefix: string,
  includePaths: string[],
  host: string,
  token: string,
  cleanUpOrphanedNotes: CleanUpOrphanedNotesStrategy,
  cleanUpOrphanedNotesInterval: number,
}
const _cacher = initCache<ConfigurationCache>({
  forceMiss: async uuid => workspace
    .getConfiguration()
    .get<any>('linenoteplus.' + uuid)!
  ,
  update: async (uuid, value) => workspace
    .getConfiguration()
    .update('linenoteplus.' + uuid, value)
  ,
});

export const Config = {
  ..._cacher('cleanUpOrphanedNotes'),
  ..._cacher('removeText'),
  ..._cacher('editText'),
  ..._cacher('notePrefix'),
  ..._cacher('includePaths'),
  ..._cacher('host'),
  ..._cacher('token'),
  ..._cacher('cleanUpOrphanedNotes'),
  ..._cacher('cleanUpOrphanedNotesInterval'),
}