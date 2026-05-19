export function bp(path: string): string {
  return `${process.env.BASE_PATH ?? ""}${path}`;
}
