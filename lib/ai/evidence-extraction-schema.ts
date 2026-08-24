import { z } from "zod";
import type { FactType } from "../../types/case";

const factTypes = ["person","organization","order_id","product","amount","currency","date","delivery_date","purchase_date","complaint_date","refund_date","communication","status","location","deadline","promised_action","generic"] as const satisfies readonly FactType[];
const confidence = ["high","medium","low"] as const;

export const evidenceExtractionSchema = z.object({
  evidenceType:z.enum(["invoice","order_confirmation","delivery_confirmation","support_conversation","refund_confirmation","product_photo","unknown"]),
  summary:z.string().max(600),
  facts:z.array(z.object({factType:z.enum(factTypes),value:z.string().min(1).max(500),normalizedValue:z.string().max(120).optional(),confidence:z.enum(confidence),sourceText:z.string().max(600).optional(),sourceRegion:z.object({description:z.string().max(240).optional()}).strict().optional()}).strict()).max(25),
  detectedDates:z.array(z.object({label:z.string().max(120),value:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),sourceText:z.string().max(600).optional()}).strict()).max(15),
  detectedAmounts:z.array(z.object({label:z.string().max(120),value:z.string().regex(/^\d+(?:\.\d{1,2})?$/),currency:z.string().regex(/^[A-Z]{3}$/).optional(),sourceText:z.string().max(600).optional()}).strict()).max(15),
  uncertainty:z.array(z.string().max(300)).max(12),
  warnings:z.array(z.string().max(300)).max(12)
}).strict();

export type EvidenceExtractionResult = z.infer<typeof evidenceExtractionSchema>;
export const evidenceExtractionJsonSchema={
  type:"object",additionalProperties:false,required:["evidenceType","summary","facts","detectedDates","detectedAmounts","uncertainty","warnings"],properties:{
    evidenceType:{type:"string",enum:["invoice","order_confirmation","delivery_confirmation","support_conversation","refund_confirmation","product_photo","unknown"]},summary:{type:"string"},
    facts:{type:"array",items:{type:"object",additionalProperties:false,required:["factType","value","confidence"],properties:{factType:{type:"string",enum:factTypes},value:{type:"string"},normalizedValue:{type:"string"},confidence:{type:"string",enum:confidence},sourceText:{type:"string"},sourceRegion:{type:"object",additionalProperties:false,properties:{description:{type:"string"}}}}}},
    detectedDates:{type:"array",items:{type:"object",additionalProperties:false,required:["label","value"],properties:{label:{type:"string"},value:{type:"string"},sourceText:{type:"string"}}}},
    detectedAmounts:{type:"array",items:{type:"object",additionalProperties:false,required:["label","value"],properties:{label:{type:"string"},value:{type:"string"},currency:{type:"string"},sourceText:{type:"string"}}}},
    uncertainty:{type:"array",items:{type:"string"}},warnings:{type:"array",items:{type:"string"}}
  }
} as const;

export function parseEvidenceExtraction(value:unknown):EvidenceExtractionResult { return evidenceExtractionSchema.parse(value); }
