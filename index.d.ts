/// <reference path="typings/index.d.ts" />
declare module "node-fetch" {
    export default function fetch(url:string|Request, init?:RequestInit):Promise<Response>;
}