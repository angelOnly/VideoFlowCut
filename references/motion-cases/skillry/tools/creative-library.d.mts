export type CreativeCard = {id:string;case_number:number;title:string;summary:string;use_when:string;card:string;video:string;clip:string;storyboard:string;start_ms:number;end_ms:number;frame_times_ms:number[];body:string;raw:string};
export type CreativeIndex = {schema_version:number;description:string;catalogue_case_count:number;processed_cases:number[];count:number;source_sha256:string;cards:CreativeCard[]};
export type CreativeRequest = {ids?:string[];query?:string;offset?:number;limit?:number;source_sha256?:string};
export function loadCreativeIndex(root:string):CreativeIndex;
export function assertCreativeSnapshot(index:CreativeIndex,source?:string):void;
export function creativeCard(card:CreativeCard):Record<string,unknown>;
export function selectCreativeCards(index:CreativeIndex,request?:CreativeRequest,ranked?:Array<{id:string;score:number}>):Record<string,unknown> & {cards:Record<string,unknown>[]};
export function readCreativeCase(root:string,request:{id:string;source_sha256?:string;include_storyboard?:boolean}):{result:Record<string,unknown>;image?:{data:string;mimeType:string}};
