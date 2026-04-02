"use client";

import { useState } from "react";
import Hero from "@/src/components/Hero";
import BookingModal from "@/src/components/booking/BookingModal";
import Navbar from "@/src/layout/Navbar";

import IntroSection from "@/src/components/home/IntroSection";
import StaySection from "@/src/components/home/StaySection";
import RestaurantSection from "@/src/components/home/RestaurantSection";
import GroupsSection from "@/src/components/home/GroupsSection";
import ContactSection from "@/src/components/home/ContactSection";

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = () => setBookingOpen(true);
  const closeBooking = () => setBookingOpen(false);

  return (
    <main className="bg-[#ece7df] text-[#2d2c29]">
      <Navbar openBooking={openBooking} />
      <Hero openBooking={openBooking} />
      {bookingOpen && <BookingModal closeBooking={closeBooking} />}

      <IntroSection />
      <StaySection openBooking={openBooking} />
      <RestaurantSection />
      <GroupsSection />
      <ContactSection />
    </main>
  );
}