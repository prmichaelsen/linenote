import { keys } from "../../utils/utils"
import { ConfAccessor } from "./accessorFactory"

export const refreshCache = async <T>(c:  { [P in keyof T]: ConfAccessor<T, P>; }) => {
  return await Promise.all(keys(c).map(async k => await c[k].forceMiss()));
}