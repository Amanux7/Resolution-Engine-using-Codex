export interface GenerateInput { system?:string; prompt:string; temperature?:number; }
import type { FactType, ExtractionMethod } from "../../types/case";
import type { PolicyReference, ResolutionActionCandidate, ResolutionContext, ResolutionRecommendationDraft } from "../../types/resolution";
export interface ExtractFactsInput { text:string; filename:string; mimeType:string; }
export interface ExtractedFactCandidate { factType:FactType; value:string; normalizedValue?:string; confidence:number; sourceText?:string; extractionMethod:ExtractionMethod; }
export interface GenerateResolutionRecommendationInput { context:ResolutionContext; policies:PolicyReference[]; candidates:ResolutionActionCandidate[]; systemInstructions:string; }
export interface AIProvider { generate(input:GenerateInput):Promise<string>; generateStructured<T>(input:GenerateInput&{schema:unknown}):Promise<T>; stream(input:GenerateInput):AsyncGenerator<string>; extractFacts(input:ExtractFactsInput):Promise<ExtractedFactCandidate[]>; generateResolutionRecommendation(input:GenerateResolutionRecommendationInput):Promise<ResolutionRecommendationDraft>; }
/** Server-side seam for a future provider. No credentials belong in the browser. */
export class MockAIProvider implements AIProvider {
  async generate({prompt}:GenerateInput){return `Mock response for: ${prompt}`;}
  async generateStructured<T>({schema}:GenerateInput&{schema:unknown}){return schema as T;}
  async *stream({prompt}:GenerateInput){yield `Mock response for: ${prompt}`;}
  async extractFacts(_input:ExtractFactsInput):Promise<ExtractedFactCandidate[]> { return []; }
  async generateResolutionRecommendation({context,policies,candidates}:GenerateResolutionRecommendationInput):Promise<ResolutionRecommendationDraft>{const selected=candidates[0];if(!selected)throw new Error("No action candidate is available.");return {caseId:context.case.id,title:selected.title,action:selected.action,explanation:selected.explanation,reasons:selected.reasons,supportingEvidence:selected.supportingEvidence,unresolvedQuestions:selected.unresolvedQuestions,risks:selected.risks,confidence:selected.confidence,priority:selected.priority,requiresUserApproval:true,status:"ready_for_review",policyReferences:policies};}
}

class OpenAIProviderPlaceholder implements AIProvider {
  async generate():Promise<string>{throw new Error("AI_MODE=openai is not connected in this prototype. Configure an OpenAI adapter on the server before using it.");}
  async generateStructured<T>():Promise<T>{throw new Error("AI_MODE=openai is not connected in this prototype. Configure an OpenAI adapter on the server before using it.");}
  async *stream():AsyncGenerator<string>{throw new Error("AI_MODE=openai is not connected in this prototype. Configure an OpenAI adapter on the server before using it.");}
  async extractFacts():Promise<ExtractedFactCandidate[]>{throw new Error("AI_MODE=openai is not connected in this prototype. Configure an OpenAI adapter on the server before using it.");}
  async generateResolutionRecommendation():Promise<ResolutionRecommendationDraft>{throw new Error("AI_MODE=openai is not connected in this prototype. Configure an OpenAI adapter on the server before using it.");}
}

export function getAIProvider():AIProvider { return process.env.AI_MODE==="openai"?new OpenAIProviderPlaceholder():new MockAIProvider(); }
