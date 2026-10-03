import { describe, expect, it } from "vitest";
import { assertVerifiedVerticalImage, getImageDimensions } from "./mediaValidation";

function pngHeader(width: number, height: number) {
  const buffer = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

describe("binary media validation", () => {
  it("reads real PNG dimensions and accepts vertical media", () => {
    const dimensions = getImageDimensions(pngHeader(1080, 1920), "image/png");
    expect(dimensions).toEqual({ width: 1080, height: 1920 });
    expect(assertVerifiedVerticalImage(pngHeader(1080, 1920), "image/png")).toEqual({ width: 1080, height: 1920 });
  });

  it("rejects a non-vertical binary image", () => {
    expect(() => assertVerifiedVerticalImage(pngHeader(1920, 1080), "image/png")).toThrow("9:16");
  });
});
