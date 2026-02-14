export interface SyncConflictInput {
  localFingerprint: string
  remoteFingerprint: string
  force: boolean
}

export function detectSyncConflict(input: SyncConflictInput): boolean {
  const { localFingerprint, remoteFingerprint, force } = input
  if (force) {
    return false
  }
  return !!localFingerprint && !!remoteFingerprint && localFingerprint !== remoteFingerprint
}
