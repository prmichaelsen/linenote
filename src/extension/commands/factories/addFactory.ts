import { Note } from "../../../models/Note";
import { log } from "../../output/getOutputChannel";

export interface AddFactoryProps {
  uuidGenerator: () => Promise<string>,
  markify: (uuid: string) => string,
  insert: (marker: string) => Promise<void>,
  toNote: (uuid: string) => Note,
  map: (note: Note) => Note,
  cache: (note: Note) => void,
  next: (note: Note) => Promise<void>,
}
export const addFactory = async (props: AddFactoryProps) => {
  const { 
    uuidGenerator,
    markify,
    insert,
    toNote,
    map,
    cache,
    next,
  } = props;
  const uuid = await log.time('uuidGenerator', uuidGenerator)();
  const marker = log.time('markify', markify)(uuid);
  await log.time('insert', insert)(marker);
  let note = log.time('toNote', toNote)(uuid);
  note = log.time('map', map)(note);
  log.time('cache', cache)(note);
  log.time('next', next)(note);
};