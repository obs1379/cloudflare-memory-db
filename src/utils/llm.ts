export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface LLMResponse { content: string; model: string; provider: string; }

export async function callLLM(messages: LLMMessage[], env: any, userConfig?: any, plainApiKey?: string): Promise<LLMResponse> {
  if (userConfig && (plainApiKey || userConfig.encrypted_llm_key) && userConfig.llm_endpoint) {
    try {
      const apiKey = plainApiKey || userConfig.encrypted_llm_key;
      const model = userConfig.llm_model || 'gpt-3.5-turbo';
      const endpoint = userConfig.llm_endpoint.replace(/\/+$/, '');
      const url = endpoint.includes('/chat/completions') ? endpoint : endpoint + '/chat/completions';
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, max_tokens: 512, temperature: 0.7 }) });
      if (res.ok) { const data = await res.json() as any; return { content: data.choices[0].message.content, model, provider: 'external' }; }
    } catch (e) { console.error('External LLM failed:', e); }
  }
  const cfModel = '@cf/meta/llama-3-8b-instruct';
  const result: any = await env.AI.run(cfModel, { messages, max_tokens: 256, temperature: 0.5 });
  return { content: result.response || result.choices?.[0]?.message?.content || '', model: cfModel, provider: 'cloudflare-ai' };
}

export async function generateEmbeddings(text: string, env: any): Promise<number[]> {
  const model = '@cf/baai/bge-base-en-v1.5';
  // Try array format first, then string format
  for (const input of [{ text: [text] }, { text: text }]) {
    try {
      const response: any = await env.AI.run(model, input);
      console.log('AI run response keys:', Object.keys(response || {}));
      if (response && response.data) {
        const vec = Array.isArray(response.data[0]) ? response.data[0] : (Array.isArray(response.data) ? response.data : []);
        if (vec.length > 0) return vec;
      }
    } catch (e: any) {
      console.error('Embedding attempt failed:', e?.message);
    }
  }
  throw new Error('All embedding attempts failed');
}
