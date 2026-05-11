import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const playgroundValidationSchema = z
  .object({
    accountType: z.enum(["individual", "company"]),
    company: z
      .object({
        name: z.string().optional(),
      })
      .optional(),
    contact: z.object({
      email: z.string().email("Enter a valid email address"),
    }),
    tags: z.array(z.string()).optional(),
    addresses: z
      .array(
        z.object({
          street: z.string().optional(),
          city: z.string().optional(),
          zip: z.string().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.accountType === "company" && !values.company?.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company", "name"],
        message: "Company name is required when account type is company",
      });
    }
  });

export const playgroundValidationResolver = zodResolver(playgroundValidationSchema);
