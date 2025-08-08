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
        <Image src="/namewithlogo.png" alt="RealityCheque" key="dark-logo" width={100} height={30}/>
      ) : (
        <Image src="/namewithlogo.png" alt="RealityCheque" key="light-logo" width={120} height={30}/>
      );
    return(
        <>
        <Link href="/" className="px-1 flex items-center space-x-2 border border-border rounded-lg">
          {mounted ? logo : <div style={{ width: 100, height: 30 }} />}
        </Link>
        </>
    )
}