var http = require("http");
var Router = require("./router");
var ecstatic = require("ecstatic");

var fileServer = ecstatic({ root: "./public" });
var router = new Router();
var talks = Object.create(null);


//Server configuration
http.createServer(function (request, response) {
    if (!router.resolve(request, response))
        fileServer(request, response);
}).listen(8888);

//Router configuration
router.add("GET", talksTitleRegex, function (request, response, title) {
    if (title in talks)
        respondJSON(response, htmlStatus.OK, talks[title]);
    else
        respond(response, htmlStatus.notFound, "Talk '" + title + "' not found.");
});

router.add("DELETE", talksTitleRegex, function (request, response, title) {
    if (title in talks) {
        delete talks[title];
        registerChange(title);
    }
    respond(response, htmlStatus.noContent, null);
});

router.add("PUT", talksTitleRegex, function (request, response, title) {
    readStreamAsJSON(request, function (error, talk) {
        if (error)
            respond(response, htmlStatus.badRequest, error.toString());
        else if (!talk || typeof talk.presenter != "string" || typeof talk.summary != "string")
            respond(response, htmlStatus.badRequest, "Invalid talk data.");
        else {
            talks[title] = {
                title: title,
                presenter: talk.presenter,
                summary: talk.summary,
                comments: []
            };
            registerChange(title);
            respond(response, htmlStatus.noContent, null);
        }
    });
});

router.add("POST", talksComentsRegex, function (request, response, title) {
    readStreamAsJSON(request, function (error, comment) {
        if (error)
            respond(response, htmlStatus.badRequest, error.toString());
        else if (!comment || typeof comment.author != "string" || typeof comment.message != "string")
            respond(response, htmlStatus.badRequest, "Invalid comment data.");
        else if (title in talks) {
            talks[title].comments.push(comment);
            registerChange(title);
            respond(response, htmlStatus.noContent, null);
        } else
            respond(response, htmlStatus.notFound, "Talk '" + title + "' not found.");
    });
});

router.add("GET", talksRegex, function (request, response) {
    var query = require("url").parse(request.url, true).query;
    if (query.changesSince == null) {
        var list = [];
        for (var title in talks)
            list.push(talks[title]);
        sendTalks(list, response);
    } else {
        var since = Number(query.changesSince);
        if (isNaN(since))
            respond(response, htmlStatus.badRequest, "Invalid parameter.");
        else {
            var changed = getChangedTalks(since);
            if (changed.length > 0)
                sendTalks(changed, response);
            else
                waitForChanges(since, response);    
        }
    }
})

//Router Regexs
var talksRegex = /^\/talks$/;
var talksTitleRegex = /^\/talks\/([^\/]+)$/;
var talksComentsRegex = /^\/talks\/([^\/]+)\/comments$/;

//Request helpers
function readStreamAsJSON(stream, callback) {
    var data = "";
    stream.on("data", function (chunk) {
        data += chunk;
    });
    stream.on("end", function () {
        var result, error;
        try {
            result = JSON.parse(data);
        }
        catch (e) {
            error = e;
        }
        callback(error, result);
    });
    stream.on("error", function (error) {
        callback(error);
    });
}

//Response helpers
var htmlStatus = new Object.create(null);
htmlStatus.OK = 200;
htmlStatus.noContent = 204;
htmlStatus.badRequest = 400;
htmlStatus.notFound = 404;

function respond(response, statusCode, data, type) {
    response.writeHead(statusCode, {
        "Content-Type": type || "text-plain"
    });
    response.end(data);
}

function respondJSON(response, statusCode, data) {
    respond(response, statusCode, JSON.stringify(data), "application/json");
}

function sendTalks(talks, response) {
    respondJSON(response, htmlStatus.OK, { serverTime: Date.now(), talks: talks });
}