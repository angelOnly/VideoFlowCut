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
    const response=await client.callTool({name:'search_motion_mechanisms',arguments:{query:'依次填充',entry:['外框'],holds:['外框保持'],limit:3}});
    assert.ok(!response.isError);const content=response.content as Array<{type:string;text:string}>;
    const result=JSON.parse(content[0].text);assert.equal(result.cards.length,3);assert.ok(result.taxonomy);
    const read=await client.callTool({name:'read_motion_mechanism',arguments:{id:result.cards[0].id,source_sha256:result.source_sha256}});
    assert.ok(!read.isError);assert.deepEqual((read.content as Array<{type:string}>).map(c=>c.type),['text','image']);
    for(const args of [{id:'../secret'},{id:result.cards[0].id,source_sha256:'0'.repeat(64)}])assert.equal((await client.callTool({name:'read_motion_mechanism',arguments:args})).isError,true);
    assert.equal((await client.callTool({name:'search_motion_mechanisms',arguments:{holds:['未知值']}})).isError,true);
    assert.equal((await client.callTool({name:'search_motion_mechanisms',arguments:{before:'001-m01',after:'002-m01'}})).isError,true);
  }finally{await client.close();await server.close();}
});
