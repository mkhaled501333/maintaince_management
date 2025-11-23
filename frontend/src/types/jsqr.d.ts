declare module 'jsqr' {
  export interface QRCode {
    binaryData: number[];
    data: string;
    chunks: Array<{
      type: string;
      data: string;
    }>;
    location: {
      topLeftCorner: { x: number; y: number };
      topRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
      topLeftFinderPattern: { x: number; y: number };
      topRightFinderPattern: { x: number; y: number };
      bottomLeftFinderPattern: { x: number; y: number };
      bottomRightAlignmentPattern?: { x: number; y: number };
    };
  }

  export interface QRCodeOptions {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  }

  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: QRCodeOptions
  ): QRCode | null;

  export default jsQR;
}

