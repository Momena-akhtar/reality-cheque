import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Logo () {
    const [mounted, setMounted] = useState(false)
    const { theme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    const logo = mounted && theme === "dark" ? (
        <Image src="/dark.svg" alt="MiniBots Logo" width={16} height={16} key="dark-logo" />
      ) : (
        <Image src="/light.png" alt="MiniBots Logo" width={16} height={16} key="light-logo" />
      );
    return(
        <>
        <Link href="/" className="flex items-center space-x-2">
          {mounted ? logo : <div style={{ width: 16, height: 16 }} />}
          <span className="text-xl font-semibold">MiniBots</span>
        </Link>
        </>
    )
}