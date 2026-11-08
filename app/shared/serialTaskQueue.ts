export interface SerialTaskContext {
  isLatest: () => boolean
}

export function createSerialTaskQueue() {
  let latestTaskId = 0
  let tail: Promise<void> = Promise.resolve()

  return {
    enqueue<T>(task: (context: SerialTaskContext) => Promise<T>): Promise<T> {
      const taskId = ++latestTaskId
      const operation = tail.then(() =>
        task({ isLatest: () => taskId === latestTaskId }),
      )
      tail = operation.then(
        () => undefined,
        () => undefined,
      )
      return operation
    },
  }
}
