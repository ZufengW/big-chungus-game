
/**
 * Things that implement IRespawnable need to have a way
 * to check if it's inactive,
 * and a way to initialise (respawn) it.
 */
export interface IRespawnable {
  init(): void;
  isInactive(): boolean;
}

/**
 * Manages an object pool of a particular kind of thing
 */
export class Factory<T extends IRespawnable> {
  private instances: T[] = [];
  private createNewInstance: () => T;
  /** Cap on maximum number of instances stored. 0 means no limit. */
  private cap: number = 0;

  /**
   * Create a new factory
   * @param createNewCharacter function that initialises a new character
   * @param cap limit on how many instances in the list
   */
  constructor(createNewCharacter: () => T, cap?: number) {
    this.createNewInstance = createNewCharacter;
    if (cap) {
      this.cap = cap;
    }
  }

  /** initialises an instance
   * @param num number of instances to spawn
   * @return an instance, or null if none available.
   */
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
    const newInstance = this.createNewInstance();
    this.instances.push(newInstance);
    return newInstance;
  }

  /** initialises up to a specified number of instances.
   * @param num number of instances to spawn
   * @return list of instances spawned
   */
  public spawnMultiple(num: number): T[] {
    let numRemaining = num;
    const spawned: T[] = [];
    for (const c of this.instances) {
      if (numRemaining > 0) {
        if (c.isInactive()) {
          c.init();
          spawned.push(c);
          numRemaining--;
        }
      } else {
        // finished spawning num instances
        return spawned;
      }
    }
    // No available inactive instances. Create new ones.
    if (this.cap) {
      numRemaining = Math.min(numRemaining, this.cap - this.instances.length);
    }
    for (; numRemaining > 0; numRemaining--) {
      const newInstance = this.createNewInstance();
      this.instances.push(newInstance);
      spawned.push(newInstance);
    }
    return spawned;
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

  /** @return total number of instances, including inactive. */
  public numInstances(): number {
    return this.instances.length;
  }

  /** @return total number of active instances */
  public numActiveInstances(): number {
    let numActive = 0;
    for (const c of this.instances) {
      if (!c.isInactive()) {
        numActive++;
      }
    }
    return numActive;
  }
}
