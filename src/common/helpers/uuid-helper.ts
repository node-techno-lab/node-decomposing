const uuid = require('uuid/v4');

export abstract class GuidHelper {
  protected constructor() {
    throw new Error('abstract util class cannot be instantiated');
  }

  static generateUuid(): string {
    return uuid();
  }
}
