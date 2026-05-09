import { useEffect, useState } from "react";

export function useLoadingText(active: boolean, base = "Loading") {
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

  return `${base}${".".repeat(dots)}${"\u00A0".repeat(3 - dots)}`;
}
