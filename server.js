var http = require("http");
var Router = require("./router");
var ecstatic = require("ecstatic");

var fileServer = ecstatic({ root: "./public" });
var router = new Router();

//Server
http.createServer(function (request, response) {
    if (!router.resolve(request, response))
        fileServer(request, response);
}).listen(8888);

var talks = Object.create(null);

router.add("GET", /^\/talks\/([^\/]+)$/,
    function (request, response, title) {
        if (title in talks)
            respondJSON(response, 200, talks[title]);
        else
            respond(response, 404, "No talk '" + title + "' found.");    
    });



//Response helpers
function respond(response, status, data, type) {
    response.writeHead(status, {
        "Content-Type": type || "text-plain"
    });
    response.end(data);
}

function respondJSON(response, status, data) {
    respond(response, status, JSON.stringify(data), "application/json");
}