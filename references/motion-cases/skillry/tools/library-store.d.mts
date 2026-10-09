export function searchLibrary(root:string,request?:Record<string,unknown>):Record<string,unknown>;
export function readLibraryMechanism(root:string,request:{id:string;part?:'mechanism'|'overview';source_sha256?:string;include_storyboard?:boolean}):{result:Record<string,unknown>;image?:string};
