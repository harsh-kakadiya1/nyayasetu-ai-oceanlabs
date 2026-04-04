"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  UserGroupIcon,
  HierarchyIcon,
  UserIcon,
  RotateLeftIcon,
  Settings02Icon,
  CpuIcon,
  CodeIcon,
  Chart01Icon,
  FlashIcon,
  Link01Icon,
  SmartPhone01Icon,
  CloudIcon,
  DatabaseIcon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

import { cn } from "@/lib/utils";

const TAG_ROWS = [
  [
    { id: "due-diligence", icon: Search01Icon, label: "Due Diligence" },
    { id: "clause-review", icon: UserGroupIcon, label: "Clause Review" },
    { id: "risk-signals", icon: HierarchyIcon, label: "Risk Signals" },
    { id: "signatures", icon: UserIcon, label: "Signature Checks" },
    { id: "amendments", icon: RotateLeftIcon, label: "Amendments" },
  ],
  [
    { id: "obligations", icon: Settings02Icon, label: "Obligations" },
    { id: "definitions", icon: CpuIcon, label: "Definitions" },
    { id: "termination", icon: CodeIcon, label: "Termination" },
    { id: "liability", icon: Chart01Icon, label: "Liability" },
    { id: "compliance", icon: FlashIcon, label: "Compliance" },
  ],
  [
    { id: "confidentiality", icon: Link01Icon, label: "Confidentiality" },
    { id: "governing-law", icon: SmartPhone01Icon, label: "Governing Law" },
    { id: "dispute-resolution", icon: CloudIcon, label: "Dispute Resolution" },
    { id: "notices", icon: DatabaseIcon, label: "Notices" },
    { id: "enforcement", icon: LockIcon, label: "Enforcement" },
  ],
];

const CONFIG = {
  containerHeight: "h-[165px] sm:h-[190px]",
  lensSize: 92,
};

const LENS_OFFSET_X = -12;
const LENS_OFFSET_Y = -8;

const MagnifiedBento = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);

  const clipPath = useMotionTemplate`circle(38px at calc(50% + ${lensX}px + ${LENS_OFFSET_X}px) calc(50% + ${lensY}px + ${LENS_OFFSET_Y}px))`;
  const inverseMask = useMotionTemplate`radial-gradient(circle 38px at calc(50% + ${lensX}px + ${LENS_OFFSET_X}px) calc(50% + ${lensY}px + ${LENS_OFFSET_Y}px), transparent 100%, black 100%)`;

  return (
    <div className="w-full py-2 not-prose lg:-translate-x-8">
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[1.6rem] bg-transparent",
          CONFIG.containerHeight
        )}
      >
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <motion.div
            style={{ WebkitMaskImage: inverseMask, maskImage: inverseMask }}
            className="flex h-full w-full flex-col justify-center gap-3"
          >
            {TAG_ROWS.map((row, rowIndex) => (
              <motion.div
                key={`row-${rowIndex}`}
                className="flex w-max gap-3"
                animate={{
                  x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
                }}
                transition={{
                  duration: 26,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {[...row, ...row, ...row].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex w-fit items-center gap-2 whitespace-nowrap rounded-full border border-[#1f383c]/10 bg-white/72 px-2.5 py-1.5 text-[11px] text-[#355a60] shadow-[0_4px_10px_rgba(31,56,60,0.06)] backdrop-blur-sm"
                  >
                    <HugeiconsIcon icon={item.icon} size={13} className="text-[#1f565f]" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 cursor-grab drop-shadow-xl active:cursor-grabbing"
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            style={{ x: lensX, y: lensY, translateX: LENS_OFFSET_X, translateY: LENS_OFFSET_Y }}
          >
            <div className="relative h-[76px] w-[76px]">
              <MagnifyingLens size={76} />
              <div className="pointer-events-none absolute inset-0 m-auto h-[48px] w-[48px] rounded-full bg-white/10" />
            </div>
          </motion.div>

          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center gap-3"
            style={{ clipPath }}
          >
            {TAG_ROWS.map((row, rowIndex) => (
              <motion.div
                key={`row-reveal-${rowIndex}`}
                className="flex w-max gap-3"
                animate={{
                  x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
                }}
                transition={{
                  duration: 26,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {[...row, ...row, ...row].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}-reveal`}
                    className="ml-5 flex w-fit scale-105 items-center gap-2 whitespace-nowrap rounded-full border border-[#1f565f]/15 bg-[#fffefb] px-2.5 py-1.5 text-[11px] text-[#1f565f] shadow-sm"
                  >
                    <HugeiconsIcon icon={item.icon} size={13} className="text-[#1f565f]" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default MagnifiedBento;

const MagnifyingLens = ({ size = 92 }: { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M365.424 335.392L342.24 312.192L311.68 342.736L334.88 365.936L365.424 335.392Z"
        fill="#B0BDC6"
      />
      <path
        d="M358.08 342.736L334.88 319.552L319.04 335.392L342.24 358.584L358.08 342.736Z"
        fill="#DFE9EF"
      />
      <path
        d="M352.368 321.808L342.752 312.192L312.208 342.752L321.824 352.36L352.368 321.808Z"
        fill="#B0BDC6"
      />
      <path
        d="M332 332C260 404 142.4 404 69.6001 332C-2.3999 260 -2.3999 142.4 69.6001 69.6C141.6 -3.20003 259.2 -2.40002 332 69.6C404.8 142.4 404.8 260 332 332ZM315.2 87.2C252 24 150.4 24 88.0001 87.2C24.8001 150.4 24.8001 252 88.0001 314.4C151.2 377.6 252.8 377.6 315.2 314.4C377.6 252 377.6 150.4 315.2 87.2Z"
        fill="#DFE9EF"
      />
      <path
        d="M319.2 319.2C254.4 384 148.8 384 83.2001 319.2C18.4001 254.4 18.4001 148.8 83.2001 83.2C148 18.4 253.6 18.4 319.2 83.2C384 148.8 384 254.4 319.2 319.2ZM310.4 92C250.4 32 152 32 92.0001 92C32.0001 152 32.0001 250.4 92.0001 310.4C152 370.4 250.4 370.4 310.4 310.4C370.4 250.4 370.4 152 310.4 92Z"
        fill="#7A858C"
      />
      <path
        d="M484.104 428.784L373.8 318.472L318.36 373.912L428.672 484.216L484.104 428.784Z"
        fill="#333333"
      />
      <path
        d="M471.664 441.224L361.344 330.928L330.8 361.48L441.12 471.76L471.664 441.224Z"
        fill="#575B5E"
      />
      <path
        d="M495.2 423.2C504 432 432.8 504 423.2 495.2L417.6 489.6C408.8 480.8 480 408.8 489.6 417.6L495.2 423.2Z"
        fill="#B0BDC6"
      />
      <path
        d="M483.2 435.2C492 444 444.8 492 435.2 483.2L429.6 477.6C420.8 468.8 468 420.8 477.6 429.6L483.2 435.2Z"
        fill="#DFE9EF"
      />
    </svg>
  );
};
