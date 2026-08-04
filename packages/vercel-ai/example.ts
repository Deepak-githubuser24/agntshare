// @ts-nocheck
import { generateText } from "ai";
// In a real app, import from your LLM provider (e.g., @ai-sdk/openai)
// import { openai } from "@ai-sdk/openai"; 
import { AgentShare } from "@agentshare/sdk";
import { createAgentShareTool } from "./src";

async function runExample() {
  const client = new AgentShare({
    apiKey: "test-user-id",
    baseUrl: "http://localhost:3000/api",
  });

  console.log("Starting agent...");

  // Mocking the model for the sake of the example without requiring an OpenAI key
  // In reality, this is: model: openai('gpt-4o')
  const mockModel: any = {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: 'mock-model',
    async doGenerate() {
      return {
        text: "I've analyzed the data and saved the detailed JSON report.",
        toolCalls: [
          {
            toolCallId: "call_123",
            toolName: "agentShare",
            args: {
              action: "share",
              filename: "report.json",
              content: JSON.stringify({ analysis: "complete", findings: [1, 2, 3] }),
              contentType: "application/json"
            }
          }
        ],
        usage: { promptTokens: 10, completionTokens: 10 },
      };
    }
  };

  const { text, toolCalls, toolResults } = await generateText({
    model: mockModel,
    prompt: "Analyze the data and save a detailed JSON report.",
    tools: {
      agentShare: createAgentShareTool(client),
    },
  });

  console.log("\nAgent Response:", text);
  console.log("\nTool Results:");
  console.log(JSON.stringify(toolResults, null, 2));
}

runExample();
