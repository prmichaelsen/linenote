import * as path from "path";
import * as fs from "fs-extra";

const rejected = Symbol("rejected");

type Result<T> = T | typeof rejected;

export const normalizePath = (filePath: string) => {
  const sep = path.sep;
  return filePath.split(sep).filter(isTruthy).join(sep);
};

export const isValidFilePath = (filePath: string) => {
  if (isTruthy(filePath)) {
    try {
      const fp = filePath.trim();
      path.resolve(normalizePath(fp));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};

export function findFiles(directoryPath: string, fileName = ""): string[] {
  const items = fs.readdirSync(directoryPath);
  const files: string[] = [];

  items.forEach((item) => {
    const itemPath = path.join(directoryPath, item);

    if (
      fs.statSync(itemPath).isFile() &&
      path.basename(itemPath) === ".linenoteplus"
    ) {
      files.push(itemPath);
    } else if (fs.statSync(itemPath).isDirectory()) {
      files.push(...findFiles(itemPath, fileName));
    }
  });
  return files;
}

export const escapeRegex = (regex: string) => {
  if (isTruthy(regex)) {
    return new RegExp(regex.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\\]/g, "\\$&"))
      .source;
  } else {
    return regex;
  }
};

export const isDefined = <T>(o: T | undefined | null): o is T =>
  o !== undefined && o !== null;

export const isTruthy = <T extends string | undefined | null>(
  o: T | string | undefined | null
): o is string => isDefined(o) && o.trim() !== "";

// convert from Promise<T>[] to Promise<T[]> by filtering resolved promises
export const filterResolved = async <T>(
  promises: Promise<T>[]
): Promise<T[]> => {
  const results: Promise<Result<T>>[] = promises.map(async (p) => {
    try {
      return await p;
    } catch (e) {
      return rejected;
    }
  });

  return (await Promise.all(results)).filter((r): r is any => r !== rejected);
};

// convert from "array of tuple" to "tuple of array"
export const splitArr = <S, T, C>(arr: Array<[S, T, C]>): [S[], T[], C[]] => {
  const sList: S[] = [];
  const tList: T[] = [];
  const cList: C[] = [];
  arr.forEach(([s, t, c]) => {
    sList.push(s);
    tList.push(t);
    cList.push(c);
  });
  return [sList, tList, cList];
};

export const keys = <T extends object>(o: T) =>
  Object.keys(o) as Array<keyof T>;

export type DiffArrProps<T> = (a: T[], b: T[]) => boolean;
/** curry with a comparator to return a function
 * that diffs arrays */
export const diffArr =
  <T>(comparator: (a: T, b: T) => boolean) =>
  (arr1: T[], arr2: T[]) => {
    const diffArr1 = arr1.filter((a) => !arr2.some((b) => comparator(a, b)));
    const diffArr2 = arr2.filter((b) => !arr1.some((a) => comparator(a, b)));
    const difference = [...diffArr1, ...diffArr2];
    return difference;
  };

/** diff array on obj equality */
export const identityDiffArr = diffArr(<T>(a: T, b: T) => a === b);
