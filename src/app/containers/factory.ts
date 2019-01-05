import { Character } from './character';

export interface IRespawnable {
  init(): void;
  isInactive(): boolean;
}

/**
 * Manages an object pool of a particular kind of thing
 */
export class Factory<T extends IRespawnable> {
  private instances: T[] = [];
  private createNewCharacter: () => T;
  private cap: number = 0;

  /**
   * Create a new factory
   * @param createNewCharacter function that initialises a new character
   * @param cap limit on how many instances in the list
   */
  constructor(createNewCharacter: () => T, cap?: number) {
    this.createNewCharacter = createNewCharacter;
    if (cap) {
      this.cap = cap;
    }
  }

  /** allocates an instance into Entering State */
  public spawn(): T {
    // look for the first available inactive instance
    for (const c of this.instances) {
      if (c.isInactive()) {
        c.init();
        return c;
      }
    }
    // No available inactive instances. Create a new one.
    if (this.cap && this.instances.length >= this.cap) {
      // Reached the limit of instances. Cannot create.
      return null;
    }
    const newCharacter = this.createNewCharacter();
    this.instances.push(newCharacter);
    return newCharacter;
  }

  /**
   *
   * @param callback function to call on each of the instances
   */
  public forEach(callback: (c: T) => void) {
    for (const c of this.instances) {
      callback(c);
    }
  }
}
