import { getAIProvider, type AIProvider } from "../ai/provider";
import type { CommunicationChannel, CommunicationContext, CommunicationTone } from "../../types/action-package";
import { validateCommunicationDraft } from "../action-package/validation";

export class CommunicationAgent {
  constructor(private readonly provider:AIProvider=getAIProvider()){}
  async prepare(context:CommunicationContext,tone:CommunicationTone="clear",channel:CommunicationChannel="support_chat"){
    if(context.recommendation.status!=="approved")throw new Error("Review the recommended next step before preparing the action.");
    const communication=await this.provider.generateCommunicationDraft({context,tone,channel,userInstruction:context.userInstruction});
    return validateCommunicationDraft(communication,context);
  }
}
