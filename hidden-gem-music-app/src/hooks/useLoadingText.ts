import { useEffect, useState } from "react";

export function useLoadingDots(active: boolean) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!active) {
      setDots(1);
      return;
    }

    const timer = setInterval(() => {
      setDots((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    return () => clearInterval(timer);
  }, [active]);

  return dots;
}

export function useLoadingText(active: boolean, base = "Loading") {
  const dots = useLoadingDots(active);
  return `${base}${".".repeat(dots)}${"\u2008".repeat(3 - dots)}`;
}

export function useStableLoadingText(active: boolean, base = "Loading") {
  const dots = useLoadingDots(active);
  return `${base}${".".repeat(dots)}${"·".repeat(3 - dots)}`;
}
