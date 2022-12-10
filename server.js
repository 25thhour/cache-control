// @ts-check

import { createHash } from "crypto";
import { createServer } from "http";

function md5(html) {
  return createHash("md5").update(html).digest("hex");
}

let server = createServer((request, response) => {
  switch (request.url) {
    case "/": {
      let config = {
        title: "Home",
        desc: ``,
        cacheHeaders: {
          "cache-control": "no-store",
        },
      };
      let html = createPage(config);
      response.writeHead(200, config.cacheHeaders);
      response.end(html);
      console.log(`${request.method} ${request.url} ${response.statusCode}`);
      break;
    }
    case "/p1": {
      let config = {
        title: "Page 1",
        desc: `Requests <b>always</b> talk to the server to validate the etag via <code>if-none-match</code>.
        A <b>304</b> is returned if the content hasn't changed.
        `,
        cacheHeaders: {
          "cache-control": "max-age=0, must-revalidate",
        },
      };
      let html = createPage(config);
      let etag = md5(html);
      if (etag === request.headers["if-none-match"]) {
        response.writeHead(304);
        response.end();
      } else {
        response.writeHead(200, {
          ...config.cacheHeaders,
          etag,
        });
        response.end(html);
      }
      console.log(`${request.method} ${request.url} ${response.statusCode}`);
      break;
    }
    case "/p2": {
      let config = {
        title: "Page 2",
        desc: `A <b>200</b> is returned from the browser disc cache within the TTL duration.
        
        When the TTL expires a request is made to the server and a <b>304</b> returned if the content hasn't changed.

        The browser will again serve <b>200</b> responses from disk cache for the TTL duration.
        `,
        cacheHeaders: {
          "cache-control": "max-age=10",
        },
      };
      let html = createPage(config);
      let etag = md5(html);
      if (etag === request.headers["if-none-match"]) {
        response.writeHead(304);
        response.end();
      } else {
        response.writeHead(200, {
          ...config.cacheHeaders,
          etag,
        });
        response.end(html);
      }
      console.log(`${request.method} ${request.url} ${response.statusCode}`);
      break;
    }
  }
});

// 3001 to avoid default 3000 on other tools
console.log("listening at http://localhost:3001\n");
server.listen(3001);

function createPage(config) {
  return `
<!doctype html>
<html lang=en>
  <head>
    <meta charset=utf-8>
    <title>${config.title}</title>
    <link rel="favicon" href="https://r2.jwdn.cc/favicon.ico"/>
  </head>
  <body>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/p1">Page 1</a></li>
      <li><a href="/p2">Page 2</a></li>
    </ul>
    <h1>${config.title}</h1>
    <pre>${JSON.stringify(config.cacheHeaders, null, 2)}</pre>
    <p>${config.desc}</p>
    <hr>
    <!-- hidden dummy data to increase payload size -->
    <p style="display: none;">
      ${Array.from({ length: 1000 })
        .map(() => "dummy data")
        .join("\n")}
    </p>
  </body>
</html>
  `;
}
