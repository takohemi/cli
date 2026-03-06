import { useState } from 'react';

// Note: Use a name like "Counter" (not "useCounter")
// The "use" prefix will be added automatically
export function use{{namePascal}}() {
  const [state, setState] = useState();

  // TODO: Implement your hook logic

  return {
    state,
    setState,
  };
}
