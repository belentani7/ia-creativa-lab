import { isVerticalNineSixteen } from "../shared/contentPolicy";

function readUInt24(buffer: Buffer, offset: number) {
  return (
    (buffer[offset] << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2]
  );
}

export function getImageDimensions(buffer: Buffer, mimeType: string) {
  if (
    mimeType === "image/png" &&
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (
    (mimeType === "image/gif" &&
      buffer.length >= 10 &&
      buffer.toString("ascii", 0, 6) === "GIF89a") ||
    (mimeType === "image/gif" && buffer.toString("ascii", 0, 6) === "GIF87a")
  ) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (
    mimeType === "image/jpeg" &&
    buffer.length > 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8
  ) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5),
        };
      }
      if (!length) break;
      offset += 2 + length;
    }
  }
  return null;
}

export function assertVerifiedVerticalImage(buffer: Buffer, mimeType: string) {
  const dimensions = getImageDimensions(buffer, mimeType);
  if (!dimensions)
    throw new Error(
      "No se pudieron verificar las dimensiones binarias de la imagen"
    );
  if (!isVerticalNineSixteen(dimensions.width, dimensions.height))
    throw new Error("El archivo real no tiene una relación 9:16");
  return dimensions;
}
