import {rocketjet}  from "../index"


function one(req, res, next) {
    req.one = true;
    next();
}

function two(req, res, next) {
    req.two = true;
    next();
}

rocketjet().use(one).use(two)
    .get('/test/', (req, res) => {
        res.send(`hello world`);
    })
    .listen(3000,()=>{
       console.log("running rocketjet");

    });

