"use client";

import Image from "next/image";
import Link from "next/link";

import { useMarinaBranding } from "@/hooks/use-marina-branding";
import { cn } from "@/lib/utils";

export const HOME_LOGO_SRC = "/home-logo.png";

type MarinaLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function MarinaLogo({
  href = "/",
  className,
  imageClassName,
  priority = false,
}: MarinaLogoProps) {
  const { name } = useMarinaBranding();

  const logo = (
    <Image
      src={HOME_LOGO_SRC}
      alt={`${name} logo`}
      width={900}
      height={210}
      priority={priority}
      className={cn(
        "h-[4.5rem] w-auto max-w-[min(100%,480px)] object-contain object-left sm:h-20 sm:max-w-[620px] md:h-24 md:max-w-[760px] lg:h-28 lg:max-w-[900px] xl:max-w-[980px]",
        imageClassName
      )}
    />
  );

  if (!href) {
    return <div className={className}>{logo}</div>;
  }

  return (
    <Link href={href} className={cn("inline-flex min-w-0 max-w-[70%] shrink items-center sm:max-w-[75%] lg:max-w-none", className)}>
      {logo}
    </Link>
  );
}
