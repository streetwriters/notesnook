import { DependencyList, EffectCallback, useEffect } from 'react';

const useImmediateEffect = (callback: EffectCallback, deps: DependencyList) => {
  useEffect(() => {
    let cleanup;
    setImmediate(() => {
      cleanup = callback();
    });
    return cleanup;
  }, deps);
};

export default useImmediateEffect;
