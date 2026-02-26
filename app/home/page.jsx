"use client";
import { Loader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push("/home/dashboard");
  }, [router]);

  return (
    <div className="w-full h-32 flex justify-center items-center [&>svg]:size-6">
      <Loader />
    </div>
  );
}