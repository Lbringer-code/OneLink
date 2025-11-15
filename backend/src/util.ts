import { nanoid } from "nanoid";

export const slugify = (text: string): string => {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  return `${slug}-${nanoid(8)}`;
};
