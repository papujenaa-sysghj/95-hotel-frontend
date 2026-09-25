import { create } from 'zustand';
// Global overlays: any page can open the booking wizard or the booking drawer.
export const useUI = create((set) => ({
  wizard: null, // { walkIn?: boolean, roomId?, checkIn?, checkOut? }
  bookingId: null, sidebar: false,
  openWizard: (opts = {}) => set({ wizard: opts }), closeWizard: () => set({ wizard: null }),
  openBooking: (id) => set({ bookingId: id }), closeBooking: () => set({ bookingId: null }),
  toggleSidebar: (v) => set((s) => ({ sidebar: v ?? !s.sidebar })),
}));
