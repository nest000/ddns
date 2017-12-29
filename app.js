const http = require('http');
const url = require('url');

const server = http.createServer().listen(process.env.NODE_PORT || 8080, process.env.NODE_IP || 'localhost');

console.log('server started: ' + server.address().address + ':' + server.address().port);

server.on('request', (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    const query = url.parse(req.url, true).query;

    const log = (...messages) => {
        if (query._log !== '1') return;
        console.log('[ ' + new Date().toISOString().slice(0, 19) + ' ]', ...messages);
    };

    if (req.url.indexOf('/test') === 0) {

        res.end(JSON.stringify({ip: ip, url: req.url, headers: req.headers}));

    } else if (req.url.indexOf('/update') === 0) {

        if (query._do !== '1') {
            const message = 'not allowed from: ' + ip;
            log('/update', message);
            return res.end(message);
        }

        const options = {
            host: query.host || '',
            port: query.port || '',
            path: (query.path ? query.path.split('?')[0] : '') + '?ip=' + ip,
            method: 'GET',
            headers: req.headers
        };

        log('/update', JSON.stringify(options));

        req.pipe(http.request(options, response => {
            let body = '';
            response
                .on('data', chunk => body += chunk)
                .on('end', () => (log('response:', body)))
                .pipe(res);
        }).on('error', error => {
            log('forward error: ' + error.message);
            res.end('end');
        }));

    } else {

        res.end('...');

    }

});
