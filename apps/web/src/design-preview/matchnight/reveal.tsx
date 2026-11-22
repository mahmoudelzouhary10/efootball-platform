'use client';
import { type ReactNode, useEffect, useState } from 'react';

/**
 * Shows its children only while the element `targetId` is off-screen.
 * Used so the mobile scorebug never duplicates the live hero that is already on screen.
 * If the target doesn't exist on the page, children are always shown.
 */
export function RevealWhenOffscreen({
  targetId,
  children,
}: {
  targetId: string;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setShow(!e!.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);
  return show ? <>{children}</> : null;
}
