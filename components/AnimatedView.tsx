"use client";

import { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface AnimatedViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedView({ children, className, delay = 0 }: AnimatedViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate={mainControls}
      transition={{ duration: 0.5, delay: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}