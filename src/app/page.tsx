// app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

const APPS = ['Calculation', 'Grapher', 'Equations'];

export default function Page() {
  return (
    <main className="app-shell flex min-h-[100dvh] items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-[100dvh] w-full max-w-[1440px] flex-col items-center gap-6 px-4 py-6">
        {/* Header pill */}
        <div className="flex h-[72px] w-full max-w-[850px] items-center justify-center rounded-[50px] bg-[linear-gradient(180deg,#FF69B4_54.81%,rgba(255,105,180,0.7)_100%)] opacity-90 shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <span className="font-[400] text-[28px] leading-[36px] text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:text-[32px] md:leading-[40px]">
            Math Wiz
          </span>
        </div>

        {/* Main area */}
        <div className="flex w-full max-w-[1000px] flex-1 items-center gap-3">
          {/* Scrollable light gray container */}
          <div
            className="
              relative
              h-full 
              w-full
              overflow-y-auto
              rounded-[40px]
              bg-[rgba(217,217,217,0.5)]
            "
          >
            <div className="grid h-full w-full grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {APPS.map((name) => (
                <Link
                  key={name}
                  href={`/${name}`}
                  className="
                    group
                    mx-auto
                    flex
                    w-full
                    max-w-[170px]
                    flex-col
                    items-center
                    rounded-[25px]
                    bg-[#FFFFFF]
                    shadow-[0_4px_12px_rgba(0,0,0,0.08)]
                    transition-transform
                    hover:-translate-y-1
                    active:scale-[0.97]
                    overflow-hidden
                  "
                >
                  {/* Image block */}
                  <div className="relative h-[170px] w-[170px] overflow-hidden rounded-[25px] bg-[#f7f0f6] shadow-[0_6px_14px_rgba(0,0,0,0.16)]">
                    <Image
                      src={`/${name}.png`}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="170px"
                    />
                  </div>

                  {/* Title at bottom */}
                  <div className="px-3 py-1 text-center">
                    <span className="block text-[20px] font-semibold tracking-tight text-[#333] group-hover:text-[#FF69B4]">
                      {name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / trademark */}
        <div className="text-[11px] font-medium tracking-tight text-[rgba(0,0,0,0.55)]">
          © 2025 — All rights belong to the dumbasses.
        </div>
      </div>
    </main>
  );
}
