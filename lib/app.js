"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = require("lodash");
const rocketroute_1 = require("rocketroute");
const request_1 = require("./request");
const response_1 = require("./response");
const enums_1 = require("rocketroute/lib/enums");
const httpError_1 = require("./httpError");
const url = require("url");
const qs = require("qs");
const Q = require("bluebird");
const querystring = require("querystring");
const util_1 = require("./util");
const errorHandler_1 = require("./errorHandler");
const server_1 = require("./server");
const middleware_1 = require("./middleware");
const view_1 = require("./view");
class App {
    constructor(options) {
        this.Defaults = {
            errorStack: false,
            errorMessage: true,
            maxRouteCache: 10000,
            qsParser: "qs",
            urlParser: "fast",
            viewExt: "html",
            viewEngine: null,
            viewFolder: ""
        };
        this.handle = (request, response) => {
            let req = request_1.createRequest(request), res = response_1.createResponse(request, response);
            try {
                this._initRequest(req, res);
                middleware_1.handleMiddleware(req, res, 0, this._middlewares);
            }
            catch (e) {
                errorHandler_1.ErrorHandler.handleError(e, res);
            }
        };
        this._options = _.extend(this.Defaults, options || {});
        this._qsParse = this._options.qsParser === "qs" ? qs.parse : querystring.parse;
        this._urlParse = this._options.urlParser === "fast" ? util_1.Util.parseUrlFast : url.parse;
        this._middlewares = [];
        this._router = new rocketroute_1.Router();
        this._view = new view_1.View(this._options);
        this._server = server_1.Server.createServer(this);
    }
    _initialize() {
        this._middlewares.push((req, res, next) => this._initRoute(req, res, next));
    }
    _initRequest(req, res) {
        let { query, pathname } = this._urlParse(req.url);
        req.query = this._qsParse(query);
        req.pathName = pathname;
        req.originUrl = req.url;
        req.app = this;
    }
    _initRoute(req, res, next) {
        let route = this._router.find(req.method, req.pathName);
        if (!route) {
            next(new httpError_1.HttpError(404, `Cannot ${req.method} ${req.pathName}`));
            return;
        }
        req.params = route.params;
        middleware_1.handleMiddleware(req, res, 0, route.handler);
    }
    render(path, params) {
        let paths = _.isArray(path) ? path : [path];
        return this._view.render(paths, params);
    }
    get options() {
        return this._options;
    }
    get(path, ...handler) {
        return this.add(enums_1.Methods.GET, path, handler);
    }
    post(path, ...handler) {
        return this.add(enums_1.Methods.POST, path, handler);
    }
    put(path, ...handler) {
        return this.add(enums_1.Methods.PUT, path, handler);
    }
    patch(path, ...handler) {
        return this.add(enums_1.Methods.PATCH, path, handler);
    }
    delete(path, ...handler) {
        return this.add(enums_1.Methods.DELETE, path, handler);
    }
    head(path, ...handler) {
        return this.add(enums_1.Methods.HEAD, path, handler);
    }
    add(method, path, handlers) {
        let dtoHandler = _(handlers).map(handler => _.isArray(handler) ? handler : [handler]).flatten().value();
        this._router.add(method, path, dtoHandler);
        return this;
    }
    use(fn) {
        this._middlewares.push(fn);
        return this;
    }
    get server() {
        return this._server;
    }
    get router() {
        return this._router;
    }
    close() {
        return Q.fromCallback(c => this._server.close(c));
    }
    listen(port, cb) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this._initialize();
            yield Q.fromCallback(c => this._server.listen(port, c));
            (cb) && cb();
        });
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map