export function stableUuid(input: string) {
  const source = input || crypto.randomUUID();
  let hashA = 0x811c9dc5;
  let hashB = 0x45d9f3b;

  for (let index = 0; index < source.length; index += 1) {
    const char = source.charCodeAt(index);
    hashA ^= char;
    hashA = Math.imul(hashA, 0x01000193);
    hashB ^= char + index;
    hashB = Math.imul(hashB, 0x27d4eb2d);
  }

  const hex = [hashA, hashB, hashA ^ hashB, Math.imul(hashA, hashB)]
    .map((part) => (part >>> 0).toString(16).padStart(8, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
