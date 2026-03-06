import { create } from 'zustand';

interface {{namePascal}}State {
  // TODO: Define your state shape
}

interface {{namePascal}}Actions {
  // TODO: Define your actions
}

export const use{{namePascal}}Store = create<{{namePascal}}State & {{namePascal}}Actions>((set) => ({
  // Initial state
  // Actions
}));
