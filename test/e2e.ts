import chai = require("chai");
import request = require("supertest");
import {rocketjet} from "../index"
import {IRequest} from "../lib/request";
import {IResponse} from "../lib/response";
import {App} from "../lib/app";
import {cors} from "./mock/corsMiddleware";
import   chaiHttp = require('chai-http');

chai.use(chaiHttp)
let should = chai.should();


describe("e2e", () => {
    let app: App;

    beforeEach(() => {
        app = rocketjet();
    });

    afterEach(async () => {
        await app.close()
    });


    describe('methods options head', function () {
        it('should  call  Options', async () => {

            await app.use(cors)
                .listen(3000);

            let res = await request(app.handle)
                .options('/test/params/aaa/bbb/?user_name=11');

            res.should.to.have.status(204);
            res.header["access-control-allow-origin"].should.be.eq('*');
            res.header["content-length"].should.be.eq('0');

            res.text.should.be.eq("")
        });

        it('should call controller Head', async () => {

            await app
                .use(cors)
                .head("/test/params/:name/:name2", (req: IRequest, res: IResponse) => {
                    res.json({
                        working: true,
                        user_name: req.query.user_name,
                    })
                })
                .listen(3000);


            let res = await
                request(app.handle)
                    .head('/test/params/aaa/bbb/?user_name=11');

            res.should.to.have.status(200);
            res.header["access-control-allow-origin"].should.be.eq('*');
            res.header["content-length"].should.be.eq('33');
            res.header["content-type"].should.be.eq('application/json; charset=utf-8');

            should.not.exist(res.text);
        });


        it('should call controller empty response', async () => {


            await app
                .use(cors)
                .get("/test/params/empty/:name/:name2", (req: IRequest, res: IResponse) => {
                    res.status(204).send();
                })
                .listen(3000);

            let res = await request(app.handle)
                .get('/test/params/empty/aaa/bbb/?user_name=11');

            res.should.to.have.status(204);
            res.header["access-control-allow-origin"].should.be.eq('*');
            res.header["content-length"].should.be.eq('0');
            should.not.exist(res.header["content-type"]);

            res.text.should.be.eq("");
        });


        // it("Should  and get route", async () => {
        //     let app = rocketjet();
        //
        //     await app.get("/test/1", (req:IRequest,res:IResponse)=> {
        //         res.send("working")
        //     }).listen(3000)
        //
        //     let result= await supertest(app.handle).get("/test/1")
        //
        //     result.text.should.eq("working")
        // });


    });
