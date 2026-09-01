export {
  getCommonFinals,
  getFinalsForInitial,
  getPinyinInitials,
  isValidPinyinCombination,
  type PinyinInitialOption,
} from '../services/publicDataRepository'

import { getPinyinInitials } from '../services/publicDataRepository'

/** @deprecated Import getPinyinInitials() from services/publicDataRepository. */
export const pinyinInitials = getPinyinInitials()
