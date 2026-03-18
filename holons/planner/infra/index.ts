export {
  createBranch,
  createWorktree,
  currentBranch,
  deleteBranch,
  removeWorktree,
  GitOperationError,
} from './git-ops.js'

export { indexFiles, FileIndexError } from './file-indexer.js'
export type { FileMetadata } from './file-indexer.js'
