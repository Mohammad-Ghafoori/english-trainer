import { useEffect, useState } from 'react';

function parse(): string[] {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

/** Tiny hash router: "#/practice/traps/he-she" → ["practice", "traps", "he-she"]. */
export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function go(path: string) {
  location.hash = '/' + path.replace(/^\/+/, '');
}

export const href = (path: string) => '#/' + path.replace(/^\/+/, '');
