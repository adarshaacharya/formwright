import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const playgroundValidationSchema = z
  .object({
    accountType: z.enum(["individual", "company"]),
    "company.name": z.string().optional(),
    "contact.email": z.string().email("Enter a valid email address"),
  })
  .superRefine((values, ctx) => {
    if (values.accountType === "company" && !values["company.name"]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company.name"],
        message: "Company name is required when account type is company",
      });
    }
  });

export const playgroundValidationResolver = zodResolver(playgroundValidationSchema);
