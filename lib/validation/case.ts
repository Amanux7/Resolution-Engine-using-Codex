import { z } from "zod";
export const createCaseSchema = z.object({ description:z.string().trim().min(12,"Tell us a little more about what happened.").max(4000) });
