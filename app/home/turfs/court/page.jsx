"use client"

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { Loader } from '@/components/ui/loader';

export default function HomeTurfsCourtPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home/turfs');
  }, [router]);

  return <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6">
    <Loader />
  </div>
}