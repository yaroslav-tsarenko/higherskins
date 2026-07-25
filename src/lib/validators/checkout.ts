import { z } from "zod";

export const checkoutContactSchema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
});

export const checkoutShippingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export const checkoutSchema = z.object({
  contact: checkoutContactSchema,
  shipping: checkoutShippingSchema,
  shippingMethod: z.string().min(1, "Shipping method is required"),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
