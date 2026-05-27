import { Context } from 'hono';
import { Env } from '../types';

export async function testAI(c: Context<{ Bindings: Env }>) {
  try {
    const model = '@cf/baai/bge-base-en-v1.5';
    const input1 = { text: ['hello world'] };
    const input2 = { text: 'hello world' };
    
    let r1: any, r2: any;
    try { r1 = await c.env.AI.run(model, input1); } catch (e: any) { r1 = { error: e.message }; }
    try { r2 = await c.env.AI.run(model, input2); } catch (e: any) { r2 = { error: e.message }; }
    
    return c.json({
      input_array: { keys: Object.keys(r1 || {}), hasData: !!r1?.data, dataLen: r1?.data?.length, firstItemLen: r1?.data?.[0]?.length, shape: r1?.shape },
      input_string: { keys: Object.keys(r2 || {}), hasData: !!r2?.data, dataLen: r2?.data?.length, firstItemLen: r2?.data?.[0]?.length, shape: r2?.shape }
    });
  } catch (e: any) {
    return c.json({ error: e.message });
  }
}
