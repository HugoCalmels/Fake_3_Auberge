"use client";

import { useState } from "react";

import Navbar from "@/components/layout/Navbar";
import BookingModal from "@/features/booking/components/BookingModal";
import ContactSection from "@/features/home/components/ContactSection";
import GroupsSection from "@/features/home/components/GroupsSection";
import Hero from "@/features/home/components/Hero";
import IntroSection from "@/features/home/components/IntroSection";
import RestaurantSection from "@/features/home/components/RestaurantSection";
import StaySection from "@/features/home/components/StaySection";

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = () => setBookingOpen(true);
  const closeBooking = () => setBookingOpen(false);

  return (
    <main className="bg-[#ece7df] text-[#2d2c29]">
      <Navbar openBooking={openBooking} />
      <Hero openBooking={openBooking} />
      {bookingOpen ? <BookingModal closeBooking={closeBooking} /> : null}
      <IntroSection />
      <StaySection openBooking={openBooking} />
      <RestaurantSection />
      <GroupsSection />
      <ContactSection />
    </main>
  );
}
