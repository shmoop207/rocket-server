import    http = require('http');
import    zlib = require('zlib');
import    cookie = require('cookie');
import    _ = require('lodash');
import {IRequest} from "./request";

const statusEmpty = {
    204: true,
    205: true,
    304: true
};


export interface IResponse extends http.ServerResponse, IAppResponse {


}

interface IAppResponse {
    req: IRequest
    useGzip: boolean;
    sending: boolean

    status(code: number): IResponse

    contentType(type: string): IResponse

    header(key: string, value: string): IResponse

    set(key: string, value: string): IResponse

    json(obj: object)

    jsonp(obj: object)

    render(path: string | string[], params?: any)

    render(params?: any): Promise<void>

    send(data?: string | Buffer)

    gzip(): IResponse

    cache(seconds: number): IResponse

    cookie(key: string, value: any, options?: cookie.CookieSerializeOptions): IResponse

    clearCookie(key: string, options?: cookie.CookieSerializeOptions): IResponse

    redirect(path: string): void
}

let proto: any = http.ServerResponse.prototype;

proto.status = function (code: number): IResponse {
    this.statusCode = code;
    return this
};

proto.contentType = function (type: string): IResponse {
    this.setHeader("Content-Type", type);
    return this;
};

proto.json = function (obj: any) {
    this.setHeader('Content-Type', "application/json; charset=utf-8");
    this.send(JSON.stringify(obj))
};

proto.render = function (path: string | string[], params?: any): Promise<void> {

    this.sending = true;

    if (arguments.length == 1 && typeof path !== "string") {
        params = path;
        path = "";
    }

    let paths = _.isArray(path) ? path : [path];


    if (!this.hasHeader("Content-Type")) {
        this.setHeader("Content-Type", "text/html;charset=utf-8")
    }

    return this.req.app.$view.render(paths, params, this)
        .then((str: string) => this.send(str))
        .catch((e) => {
            this.sending = false;
            this.req.next(e)
        })
};

proto.set = proto.header = function (field: string | { [index: string]: string }, value?: number | string | string[]): IResponse {

    if (arguments.length === 2) {
        this.setHeader(field, value);

    } else {
        let keys = Object.keys(field);
        for (let i = 0, length = keys.length; i < length; i++) {
            let key = keys[i];
            this.setHeader(key, field[key]);
        }
    }

    return this
};

proto.cache = function (seconds: number) {
    this.setHeader("Cache-Control", `public, max-age=${seconds}`);

    return this;
};

proto.cookie = function (name: string, value: any, options?: cookie.CookieSerializeOptions): IResponse {
    let opts: cookie.CookieSerializeOptions = options || {};

    let val: string = _.isObject(value) ? 'j:' + JSON.stringify(value) : String(value);

    if ('maxAge' in opts) {
        opts.expires = new Date(Date.now() + opts.maxAge);
        opts.maxAge /= 1000;
    }

    if (opts.path == null) {
        opts.path = '/';
    }

    this.append('Set-Cookie', cookie.serialize(name, val, opts));

    return this;
};

proto.clearCookie = function (name: string, options?: cookie.CookieSerializeOptions): IResponse {
    let opts: cookie.CookieSerializeOptions = options || {};
    opts.expires = new Date(1);
    opts.path = '/';

    this.cookie(name, '', opts);

    return this;
}

proto.redirect = function (path: string): void {

    if (this.statusCode) {
        this.statusCode = 302;
    }
    this.setHeader("Location", path);
    this.send()
}

proto.get = function (field: string): string | string[] {
    return this.getHeader(field);
};

proto.append = function (field: string, value: string): IResponse {
    let current = this.getHeader(field);

    if (!current) {
        return this.setHeader(field, value)
    }
    let val: string[] = _.isArray(current)
        ? current.concat(value)
        : (_.isArray(value) ? [current].concat(value) : [current, value]);

    return this.setHeader(field, val);
};


proto.gzip = function () {
    this.useGzip = true;
    return this;
};

proto.jsonp = function (data: any) {
    let body = data;

    if (this.req.method == "GET" && this.req.query["callback"]) {
        if (!this.getHeader('Content-Type')) {
            this.setHeader('X-Content-Type-Options', 'nosniff');
            this.setHeader('Content-Type', 'text/javascript');
        }

        let callback = this.req.query["callback"].replace(/[^\[\]\w$.]/g, '');
        body = JSON.stringify(data)
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');

        body = `/**/ typeof ${callback} === 'function' && ${callback}(${body});`;
    }

    this.send(body);
};

proto.send = function (data?: string | Buffer) {

    this.sending = true;

    let isEmptyStatusCode = statusEmpty[this.statusCode || (this.statusCode = 200)];

    //send empty
    if (isEmptyStatusCode || data == undefined) {
        this.setHeader('Content-Length', '0');
        this.end();
        return
    }

    if (!this.hasHeader("Content-Type")) {
        if (typeof data === 'string' || this.getHeader("Content-Encoding") == "gzip") {
            this.setHeader("Content-Type", "text/plain;charset=utf-8");
        } else if (Buffer.isBuffer(data)) {
            this.setHeader("Content-Type", "application/octet-stream");
        } else {
            data = JSON.stringify(data);
            this.setHeader("Content-Type", "application/json; charset=utf-8");
        }
    }

    //check if need to gzip
    if (this.useGzip && data) {
        gzipResponse(this, data);
        return;
    }

    this.setHeader('Content-Length', Buffer.byteLength(data as string, 'utf8'));

    this.req.method[0] == 'H' ? this.end() : this.end(data);
};


function gzipResponse(res: IResponse, data: any) {
    zlib.gzip(data, (err, gziped) => {
        res.useGzip = false;

        if (err) {
            res.send(data);
            return;
        }

        res.setHeader('Content-Encoding', "gzip");
        res.send(gziped)
    });
}

export function createResponse(request: http.IncomingMessage, response: http.ServerResponse): IResponse {
    let res = response as IResponse;
    res.req = request as IRequest;
    return res;
}

export let Response = http.ServerResponse;
