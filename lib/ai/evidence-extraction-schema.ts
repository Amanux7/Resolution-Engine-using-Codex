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
    facts:{
      type:"array",
      items:{
        type:"object",additionalProperties:false,
        required:["factType","value","normalizedValue","confidence","sourceText","sourceRegion"],
        properties:{
          factType:{type:"string",enum:factTypes},value:{type:"string"},
          normalizedValue:{anyOf:[{type:"string"},{type:"null"}]},confidence:{type:"string",enum:confidence},
          sourceText:{anyOf:[{type:"string"},{type:"null"}]},
          sourceRegion:{anyOf:[{type:"object",additionalProperties:false,required:["description"],properties:{description:{anyOf:[{type:"string"},{type:"null"}]}}},{type:"null"}]}
        }
      }
    },
    detectedDates:{
      type:"array",
      items:{type:"object",additionalProperties:false,required:["label","value","sourceText"],properties:{label:{type:"string"},value:{type:"string"},sourceText:{anyOf:[{type:"string"},{type:"null"}]}}}
    },
    detectedAmounts:{
      type:"array",
      items:{type:"object",additionalProperties:false,required:["label","value","currency","sourceText"],properties:{label:{type:"string"},value:{type:"string"},currency:{anyOf:[{type:"string"},{type:"null"}]},sourceText:{anyOf:[{type:"string"},{type:"null"}]}}}
    },
    uncertainty:{type:"array",items:{type:"string"}},warnings:{type:"array",items:{type:"string"}}
  }
} as const;

/** The Responses API requires strict schemas to model optional fields as nullable.
 * Convert only those explicit null placeholders back to optional application fields
 * before the existing Zod boundary validates the result. */
export function parseEvidenceExtraction(value:unknown):EvidenceExtractionResult {
  if(!value||typeof value!=="object")return evidenceExtractionSchema.parse(value);
  const input=value as Record<string,unknown>;
  const optional=(item:unknown,keys:string[])=>{
    if(!item||typeof item!=="object")return item;
    const record={...(item as Record<string,unknown>)};
    for(const key of keys)if(record[key]===null)record[key]=undefined;
    if(record.sourceRegion&&typeof record.sourceRegion==="object"){
      const region={...(record.sourceRegion as Record<string,unknown>)};
      if(region.description===null)region.description=undefined;
      record.sourceRegion=region;
    }else if(record.sourceRegion===null)record.sourceRegion=undefined;
    return record;
  };
  return evidenceExtractionSchema.parse({
    ...input,
    facts:Array.isArray(input.facts)?input.facts.map(item=>optional(item,["normalizedValue","sourceText","sourceRegion"])):input.facts,
    detectedDates:Array.isArray(input.detectedDates)?input.detectedDates.map(item=>optional(item,["sourceText"])):input.detectedDates,
    detectedAmounts:Array.isArray(input.detectedAmounts)?input.detectedAmounts.map(item=>optional(item,["currency","sourceText"])):input.detectedAmounts
  });
}
