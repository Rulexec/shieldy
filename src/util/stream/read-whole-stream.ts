import {Stream} from 'stream';

export const readWholeStream = (stream: Stream): Promise<Buffer> => {
  return new Promise((onResult, onError) => {
    const buffers: Buffer[] = [];
    let totalLength = 0;

    stream.on('data', (buffer) => {
      if (!buffers) return;

      totalLength += buffer.length;

      buffers.push(buffer);
    });

    stream.on('error', onError);

    stream.on('end', () => {
      if (!buffers) return;

      const buffer = Buffer.concat(buffers, totalLength);

      onResult(buffer);
    });
  });
};
