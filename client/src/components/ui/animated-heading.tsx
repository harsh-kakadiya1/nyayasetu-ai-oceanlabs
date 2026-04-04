import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

function AnimatedHeading() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => [
      "Upload any contract,",
      "surface hidden risks,",
      "sign with confidence.",
    ],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div>
      <h1 className="font-display mx-auto max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tight text-[#1b3338] sm:text-6xl lg:text-7xl">
        <span className="block">Nyayasetu.ai</span>
        <span className="relative mt-2 block h-[1.2em] overflow-hidden text-[#a24e2f]">
          {titles.map((title, index) => (
            <motion.span
              key={index}
              className="absolute inset-x-0 block"
              initial={{ opacity: 0, y: -80 }}
              transition={{ type: "spring", stiffness: 55, damping: 14 }}
              animate={
                titleNumber === index
                  ? { y: 0, opacity: 1 }
                  : { y: 120, opacity: 0 }
              }
            >
              {title}
            </motion.span>
          ))}
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#355a60] sm:text-lg">
        Nyayasetu AI turns legal complexity into clear action points. Upload any agreement, detect hidden risk, and prepare better questions before you sign.
      </p>
    </div>
  );
}

export { AnimatedHeading };
