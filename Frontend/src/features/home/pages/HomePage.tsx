"use client";

import { useState } from "react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import BookingModal from "@/features/booking/components/BookingModal";

import Hero from "@/features/home/components/Hero";
import AubergeSection from "@/features/home/components/AubergeSection";
import VillageSection from "@/features/home/components/VillageSection";
import RoomsSection from "@/features/home/components/RoomsSection";
import RestaurantSection from "@/features/home/components/RestaurantSection";
import GroupsSection from "@/features/home/components/GroupsSection";
import ContactSection from "@/features/home/components/ContactSection";

import type { AdminRoomTypeDto } from "@/features/admin/types";

type Props = {
  roomTypes?: AdminRoomTypeDto[];
};

export default function HomePage({ roomTypes = [] }: Props) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [keepNavbarVisibleToken, setKeepNavbarVisibleToken] = useState(0);

  const openBooking = () => setBookingOpen(true);
  const closeBooking = () => setBookingOpen(false);

  const keepNavbarVisible = () => {
    setKeepNavbarVisibleToken(Date.now());
  };

  return (
    <main id="top" className="bg-[#ece7df] text-[#2d2c29]">
      <Navbar
        openBooking={openBooking}
        keepVisibleToken={keepNavbarVisibleToken}
      />

      <Hero openBooking={openBooking} />

      {bookingOpen ? <BookingModal closeBooking={closeBooking} /> : null}

      <AubergeSection />

      <RoomsSection roomTypes={roomTypes} openBooking={openBooking} />

      <RestaurantSection />

      <GroupsSection keepNavbarVisible={keepNavbarVisible} />

      <VillageSection />

      <ContactSection />

      <Footer />
    </main>
  );
}