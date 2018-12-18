import * as cache from './type-cache';

export const EventTypes = {
  EXEC_CMD: cache.type('EXEC_CMD'),
  EXEC_CMD_SUCCESS: cache.type('EXEC_CMD_SUCCESS'),
  EXEC_CMD_FAILURE: cache.type('EXEC_CMD_FAILURE')
};
