import { Character } from './character';

/**
 * Manages an object pool of a particular kind of Character
 */
export class CharacterFactory<T extends Character> {
  private characters: T[] = [];
  private createNewCharacter: () => T;

  /**
   *
   * @param createNewCharacter function that initialises a new character
   */
  constructor(createNewCharacter: () => T) {
    this.createNewCharacter = createNewCharacter;
  }

  /** allocates a character into Entering State */
  public spawn(): T {
    // look for the first available inactive character
    for (const c of this.characters) {
      if (c.isInactive()) {
        c.init();
        return c;
      }
    }
    // No available characters. Create a new one
    const newCharacter = this.createNewCharacter();
    this.characters.push(newCharacter);
    return newCharacter;
  }

  public forEach(callback: (c: T) => void) {
    for (const c of this.characters) {
      callback(c);
    }
  }
}
