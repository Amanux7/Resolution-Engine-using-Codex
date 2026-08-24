import type { FactType, ExtractionMethod } from "../../types/case";
import type { ExtractedFactCandidate } from "../ai/provider";
const dateWords:[RegExp,FactType][]=[[/ordered|order placed|purchased|bought/i,"purchase_date"],[/delivered|delivery/i,"delivery_date"],[/damage reported|reported damage|complaint/i,"complaint_date"],[/refund (?:expected|promised|processed|received)/i,"refund_date"]];
function isoDate(raw:string){
  const monthMatch=raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})$/i);
  if(monthMatch){
    const month=new Date(`${monthMatch[1]} 1, 2000`).getMonth()+1;
    const day=Number(monthMatch[2]);
    const year=new Date().getUTCFullYear();
    const value=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const parsed=new Date(`${value}T00:00:00Z`);
    return parsed.getUTCDate()===day?value:undefined;
  }
  const parsed=new Date(raw);
  return Number.isNaN(parsed.getTime())?undefined:parsed.toISOString().slice(0,10);
}
export function extractFactsFromText(text:string):ExtractedFactCandidate[]{const candidates:ExtractedFactCandidate[]=[];const lines=text.split(/\n|(?<=[.!?])\s+/).map(line=>line.trim()).filter(Boolean);const add=(candidate:ExtractedFactCandidate)=>candidates.push(candidate);
  const order=text.match(/\b(?:RX|ORD|ORDER)[- ]?\d{3,}\b/i);if(order)add({factType:"order_id",value:order[0].toUpperCase(),confidence:.99,sourceText:order[0],extractionMethod:"parser"});
  const amount=text.match(/(?:₹|INR|Rs\.?)[ ]?[\d,]+(?:\.\d{1,2})?/i);if(amount)add({factType:"amount",value:amount[0],normalizedValue:amount[0].replace(/[^0-9.]/g,""),confidence:.98,sourceText:amount[0],extractionMethod:"parser"});
  if(/examplemart|seller|marketplace/i.test(text))add({factType:"organization",value:(text.match(/ExampleMart/i)?.[0]??"seller"),confidence:.75,sourceText:lines.find(line=>/examplemart|seller|marketplace/i.test(line)),extractionMethod:"parser"});
  for(const line of lines){for(const [pattern,type] of dateWords){if(!pattern.test(line))continue;const dateMatch=line.match(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2})\b/i);if(dateMatch){const candidateDate=isoDate(dateMatch[0]);if(candidateDate)add({factType:type,value:dateMatch[0],normalizedValue:candidateDate,confidence:.9,sourceText:line,extractionMethod:"parser"});}}if(/refund|pickup|return|damage|delivered|ordered/i.test(line))add({factType:"status",value:line,confidence:.72,sourceText:line,extractionMethod:"parser"});}
  return candidates;
}
export const deterministicExtractionMethod:ExtractionMethod="parser";
