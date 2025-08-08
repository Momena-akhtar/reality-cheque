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
        <Image src="/dark.png" alt="RealityCheque" key="dark-logo" width={100} height={30}/>
      ) : (
        <Image src="/white.svg" alt="RealityCheque" key="light-logo" width={100} height={30}/>
      );
    return(
        <>
        <Link href="/" className="flex items-center space-x-2">
          {mounted ? logo : <div style={{ width: 100, height: 30 }} />}
        </Link>
        </>
    )
}