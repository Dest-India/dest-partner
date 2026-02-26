"use client"

import { useSidebarStore } from '@/components/sidebar/sidebar-data';
import TurfsBookingsList from '@/components/site/turfs/turfs-bookings-list';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { getUserInfo } from '@/lib/store';

export default function HomeTurfsBookingsPage() {
  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(state => state.setActiveSidebarItem);

  useEffect(() => {
    const user = getUserInfo();
    if (user?.role !== 'Turf') {
      router.push('/home/dashboard');
      return;
    }
    setActiveSidebarItem("turfs-bookings");
  }, [setActiveSidebarItem, router])

  return (
    <div className="flex flex-col gap-4">
      <TurfsBookingsList />
    </div>
  )
}