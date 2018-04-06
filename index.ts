import {IOptions} from "./lib/IOptions";
import {Agent} from "./lib/agent";
import {MiddlewareHandler, MiddlewareHandlerAny, MiddlewareHandlerParams, NextFn} from "./lib/types";

export {Agent} from './lib/agent'
export {IRequest} from './lib/request'
export {IResponse} from './lib/response'
export {Methods} from 'appolo-route';
export {MiddlewareHandlerParams, MiddlewareHandler, MiddlewareHandlerAny, NextFn} from './lib/types'

export function createAgent(options?: IOptions) {
    return new Agent(options)
}

export default function (options?: IOptions) {
    return new Agent(options);
}