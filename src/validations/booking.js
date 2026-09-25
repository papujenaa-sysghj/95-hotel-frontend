import { z } from 'zod';
export const guestStep = z.object({
  guestName: z.string().min(2, 'Enter the guest’s full name'), phone: z.string().regex(/^[+\d][\d\s-]{6,}$/, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(), address: z.string().optional(), idType: z.string().optional(), idNumber: z.string().optional(),
});
export const stayStep = z.object({
  checkInDate: z.string().min(1, 'Choose a check-in date'), checkOutDate: z.string().min(1, 'Choose a check-out date'),
  adults: z.coerce.number().int().min(1, 'At least 1 adult'), children: z.coerce.number().int().min(0),
}).refine((d) => d.checkOutDate > d.checkInDate, { message: 'Check-out date must be after check-in date.', path: ['checkOutDate'] });
export const pricingStep = z.object({
  roomRate: z.coerce.number().min(0), extraBedCharge: z.coerce.number().min(0), otherCharges: z.coerce.number().min(0), discount: z.coerce.number().min(0),
});
export const calcTotals = ({ roomRate = 0, nights = 0, extraBedCharge = 0, otherCharges = 0, discount = 0, taxPercent = 0 }) => {
  const subtotal = roomRate * nights + Number(extraBedCharge) + Number(otherCharges); const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxPercent) / 100; return { subtotal, tax, total: taxable + tax };
};
