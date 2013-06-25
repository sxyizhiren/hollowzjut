var Tools=require('../shareTool');
var app=Tools.app;

var routes = require('./routes')
var talk = require('./routes/talk')
var http = require('http')
var path = require('path');


    app.get('/', routes.index);
    app.get('/talk/', talk.default);
    app.get('/talk/:msg', talk.ask);



function init(){
    console.log('Query Robot Listen on http://127.0.0.1/talk/*');
    //什么都不用做
}

exports.init=init;



