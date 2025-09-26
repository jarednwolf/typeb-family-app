let queue: any[] = [];

// Base implementations
const baseAddToQueue = async (operation: any) => {
  queue.push({ ...operation });
  return `${Date.now()}`;
};
const baseGetQueue = async () => {
  return [...queue];
};
const baseProcessOperation = async (_op: any) => true;
const baseRemoveFromQueue = async (idOrOp: any) => {
  if (typeof idOrOp === 'string') {
    queue = queue.filter((q) => q.id !== idOrOp);
  } else {
    queue = queue.filter((q) => q !== idOrOp);
  }
  return true;
};
const baseProcessQueue = async () => {
  const ops = await getQueue();
  let processed = 0;
  let failed = 0;
  for (const op of ops) {
    try {
      await processOperation(op as any);
      await removeFromQueue(op as any);
      processed++;
    } catch (_e) {
      failed++;
    }
  }
  return { processed, failed };
};
const baseRetryOperation = async (op: any) => {
  const next = { ...op, retryCount: (op.retryCount || 0) + 1 };
  return { success: false, retryCount: next.retryCount };
};
const baseShouldRetry = (op: any) => (op.retryCount || 0) < 5;

// Jest mocks delegating to base implementations
const addToQueue = jest.fn(baseAddToQueue);
const getQueue = jest.fn(baseGetQueue);
const processOperation = jest.fn(baseProcessOperation);
const removeFromQueue = jest.fn(baseRemoveFromQueue);
const processQueue = jest.fn(baseProcessQueue);
const retryOperation = jest.fn(baseRetryOperation);
const shouldRetry = jest.fn(baseShouldRetry);

const __restoreDefaults = () => {
  addToQueue.mockImplementation(baseAddToQueue);
  getQueue.mockImplementation(baseGetQueue);
  processOperation.mockImplementation(baseProcessOperation);
  removeFromQueue.mockImplementation(baseRemoveFromQueue);
  processQueue.mockImplementation(baseProcessQueue);
  retryOperation.mockImplementation(baseRetryOperation);
  shouldRetry.mockImplementation(baseShouldRetry);
};

const __reset = () => {
  queue = [];
  addToQueue.mockReset();
  getQueue.mockReset();
  processOperation.mockReset();
  removeFromQueue.mockReset();
  processQueue.mockReset();
  retryOperation.mockReset();
  shouldRetry.mockReset();
  __restoreDefaults();
};

export default {
  addToQueue,
  getQueue,
  processOperation,
  removeFromQueue,
  processQueue,
  retryOperation,
  shouldRetry,
  __reset,
  __restoreDefaults,
};

