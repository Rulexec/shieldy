import {Readable} from 'stream';
import {Defer} from '../async/defer';

const DEFAULT_BUFFER_SIZE = 8 * 1024 * 1024;
const DEFAULT_MAX_LINE_LENGTH = 4 * 1024 * 1024;

const enum ChunkProcessingAction {
  continueProcessing,
  pauseProcessing,
  stopProcessing,
}

export const createLinesStream = ({
  stream,
  bufferSize = DEFAULT_BUFFER_SIZE,
  maxLineLength = DEFAULT_MAX_LINE_LENGTH,
}: {
  stream: Readable;
  // Counted in string length
  bufferSize?: number;
  // Will throw exception if line will exceed this value
  maxLineLength?: number;
}): {
  getGenerator: () => AsyncGenerator<string, void, void>;
  destroy: () => void;
} => {
  let destroyed = false;
  let error: unknown = null;
  let totalChunksLength = 0;
  let chunks: string[] = [];
  let totalLinesLength = 0;
  const lines: string[] = [];
  let linesAvailableDefer = new Defer();

  function getGenerator(): AsyncGenerator<string, void, void> {
    return {
      next: async () => {
        while (!lines.length) {
          linesAvailableDefer = new Defer();
          await linesAvailableDefer.promise;

          if (error) {
            throw error;
          }

          if (destroyed) {
            return {value: undefined, done: true};
          }
        }

        if (error) {
          throw error;
        }

        if (destroyed) {
          return {value: undefined, done: true};
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const line = lines.shift()!;
        totalLinesLength -= line.length;

        if (totalLinesLength < bufferSize) {
          stream.resume();
        }

        return {value: line, done: false};
      },
      return: () => {
        return Promise.resolve({value: undefined, done: true});
      },
      throw: () => {
        return Promise.resolve({value: undefined, done: true});
      },
      [Symbol.asyncIterator]: getGenerator,
    };
  }

  const destroy = () => {
    destroyed = true;
    linesAvailableDefer.resolve();

    stream.off('data', onData);
    stream.off('end', onEnd);
    stream.off('error', onError);
  };

  const pushChunk = (str: string): ChunkProcessingAction => {
    totalChunksLength += str.length;

    if (totalChunksLength > maxLineLength) {
      error = new Error('createLinesStream maxLineHeight reached');
      return ChunkProcessingAction.stopProcessing;
    }

    chunks.push(str);

    return totalChunksLength >= bufferSize
      ? ChunkProcessingAction.pauseProcessing
      : ChunkProcessingAction.continueProcessing;
  };

  const onData = (data: string): void => {
    if (!data) {
      return;
    }

    let action: ChunkProcessingAction;

    const chunkLines = data.split('\n');
    if (chunkLines.length === 1) {
      action = pushChunk(data);
    } else {
      const firstLine = chunks.join('') + chunkLines[0];
      lines.push(firstLine);
      totalLinesLength += firstLine.length;

      for (let i = 1; i < chunkLines.length - 1; i++) {
        const line = chunkLines[i];
        lines.push(line);
        totalLinesLength += line.length;
      }

      const lastLine = chunkLines[chunkLines.length - 1];
      chunks = [lastLine];
      totalChunksLength = lastLine.length;

      action =
        totalLinesLength >= bufferSize
          ? ChunkProcessingAction.pauseProcessing
          : ChunkProcessingAction.continueProcessing;

      linesAvailableDefer.resolve();
    }

    switch (action) {
      case ChunkProcessingAction.continueProcessing:
        break;
      case ChunkProcessingAction.pauseProcessing:
        stream.pause();
        break;
      case ChunkProcessingAction.stopProcessing:
        destroy();
        break;
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const shouldBeNever: never = action;
      }
    }
  };

  const onEnd = () => {
    destroy();
  };

  const onError = (err: unknown): void => {
    error = err || new Error('createLinesStream stream error');
    destroy();
  };

  stream.on('data', onData);
  stream.on('end', onData);
  stream.on('error', onError);

  return {
    getGenerator,
    destroy,
  };
};
