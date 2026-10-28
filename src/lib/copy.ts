/**
 * The product's word for one kid's daily page. Change it here (e.g. "page" / "pages")
 * and every string that uses it follows.
 */
export const NOUN = { one: "page", many: "pages" } as const;

/** "1 dispatch" / "2 dispatches". */
export const countNoun = (n: number) => `${n} ${n === 1 ? NOUN.one : NOUN.many}`;
