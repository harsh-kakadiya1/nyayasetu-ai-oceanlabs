import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

function AnimatedHeading() {
  const { t, i18n } = useTranslation();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => [t("landing.hero.title"), t("landing.hero.highlight")],
    [i18n.resolvedLanguage, t]
  );

  useEffect(() => {
    setTitleNumber(0);
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    if (titles.length <= 1) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div>
      <h1 className="font-display mx-auto max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight text-[#1b3338] sm:text-6xl sm:leading-[0.98] lg:text-7xl">
        <span className="block">{t("brand.name")}</span>
        <span className="relative mt-2 block min-h-[2.4em] overflow-hidden text-[#a24e2f] sm:min-h-[1.2em]">
          {titles.map((title, index) => (
            <motion.span
              key={index}
              className="absolute inset-x-0 block leading-[1.05]"
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
        {t("landing.hero.description")}
      </p>
    </div>
  );
}

export { AnimatedHeading };
