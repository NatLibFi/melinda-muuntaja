import { SELECT_MERGETYPE } from '../constants/action-type-constants';

export function selectMergeType(mergeType) {
  console.log('select mergetype actionsissa: ', mergeType);
  return function(dispatch) {
    dispatch({
      type: SELECT_MERGETYPE,
      mergeType
    });
  };
}