import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerMotionLibraryTools } from '../apps/server/src/motion-library-tools.js';

test('真实MCP协议可发现两入口，查询后按指纹读取图文，拒绝越界及无效条件',async()=>{
  const server=new McpServer({name:'motion-test',version:'1'});registerMotionLibraryTools(server,resolve('references/motion-cases/skillry'));
  const client=new Client({name:'motion-reader',version:'1'});const [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);await client.connect(clientTransport);
  try{
    const listing=await client.listTools();assert.deepEqual(listing.tools.map(t=>t.name).sort(),['read_motion_mechanism','search_motion_mechanisms']);
    const response=await client.callTool({name:'search_motion_mechanisms',arguments:{limit:3}});
    assert.ok(!response.isError);const content=response.content as Array<{type:string;text:string}>;
    const result=JSON.parse(content[0].text);assert.equal(result.cards.length,3);assert.ok(result.taxonomy);
    for(const card of result.cards){
      assert.ok(Array.isArray(card.case_context.video_types));
      assert.ok(Array.isArray(card.case_context.materials));
      assert.equal(typeof card.case_context.material_requirements,'string');
      assert.equal(typeof card.case_context.transfer_cost,'string');
    }
    const read=await client.callTool({name:'read_motion_mechanism',arguments:{id:result.cards[0].id,source_sha256:result.source_sha256}});
    assert.ok(!read.isError);assert.deepEqual((read.content as Array<{type:string}>).map(c=>c.type),['text','image']);
    const readData=JSON.parse((read.content as Array<{text:string}>)[0]!.text);
    assert.deepEqual(readData.card.case_context,result.cards[0].case_context);
    const clipRead=await client.callTool({name:'read_motion_mechanism',arguments:{id:'002-m17',include_storyboard:false}});
    assert.notEqual(clipRead.isError,true);
    const clipData=JSON.parse((clipRead.content as Array<{text:string}>)[0]!.text);
    assert.match(clipData.card.clip.path,/\/mechanisms\/m17\.mp4$/);
    assert.match(clipData.video_path,/video\.mp4$/);assert.ok(clipData.card.clip.end_ms>clipData.card.clip.start_ms);
    for(const args of [{id:'../secret'},{id:result.cards[0].id,source_sha256:'0'.repeat(64)}])assert.equal((await client.callTool({name:'read_motion_mechanism',arguments:args})).isError,true);
    assert.equal((await client.callTool({name:'search_motion_mechanisms',arguments:{holds:['未知值']}})).isError,true);
    assert.equal((await client.callTool({name:'search_motion_mechanisms',arguments:{before:'001-m01',after:'002-m16'}})).isError,true);
  }finally{await client.close();await server.close();}
});

test('动画交接可经真实协议浏览、核读和恢复采用，语义入口缺服务时明确失败',async()=>{
  const server=new McpServer({name:'mechanism-handoff',version:'1'});
  registerMotionLibraryTools(server,resolve('references/motion-cases/skillry'));
  const client=new Client({name:'motion-author',version:'1'});
  const [local,remote]=InMemoryTransport.createLinkedPair();
  await server.connect(remote);await client.connect(local);
  const query=async(args:Record<string,unknown>)=>{
    const result=await client.callTool({name:'search_motion_mechanisms',arguments:args});
    assert.notEqual(result.isError,true,JSON.stringify(result.content));
    const block=(result.content as Array<{type:string;text?:string}>).find(item=>item.type==='text');
    return JSON.parse(block!.text!);
  };
  try{
    const schema=await client.listTools();
    assert.ok(schema.tools.every(tool=>tool.annotations?.readOnlyHint===true));
    const stages=await query({limit:2});
    const ids:string[]=stages.cards.map((card:{id:string})=>card.id);
    for(const id of ids){
      const read=await client.callTool({name:'read_motion_mechanism',arguments:{id,source_sha256:stages.source_sha256}});
      assert.notEqual(read.isError,true);
      assert.deepEqual((read.content as Array<{type:string}>).map(item=>item.type),['text','image']);
    }
    const selection={v:1,source_sha256:stages.source_sha256,ids:[...ids].reverse(),adopted:[ids[0]]};
    const restored=await query({selection:'http://127.0.0.1/library/compare.html?'+new URLSearchParams({selection:JSON.stringify(selection)})});
    assert.deepEqual(restored.cards.map((card:{id:string})=>card.id),selection.ids);
    assert.deepEqual(restored.selection.adopted,selection.adopted);
    assert.deepEqual((await query({ids})).cards.map((card:{id:string})=>card.id),ids);
    for(const args of [{stages:['填充'],similar_to:ids[0]},{ids,source_sha256:'0'.repeat(64)}]){
      const refused=await client.callTool({name:'search_motion_mechanisms',arguments:args});
      assert.equal(refused.isError,true);
    }
    const missing=await client.callTool({name:'search_motion_mechanisms',arguments:{query:'依次填满网格'}});
    assert.equal(missing.isError,true);
    assert.equal(JSON.parse((missing.content as Array<{text:string}>)[0].text).code,'MOTION_SEMANTIC_UNAVAILABLE');
  }finally{await client.close();await server.close();}
});
