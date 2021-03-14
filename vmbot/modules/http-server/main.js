var http = require('http');

var logPre = '[HTTPServ] ';
function HTTPServ(vms, cfg) {
    // Prefix
    // Set port number (or default to 8080)
    var portNo = (cfg && cfg.port) ? cfg.port : 8080;

    this.svr = http.createServer(function(req, res) {
        var urlSpl = req.url.split('/');

        // filter out empty bullshit
        for(var ix = 0; ix < urlSpl.length; ++ ix)
            if(urlSpl[ix].length < 1)
                urlSpl.splice(ix --, 1);

        switch(urlSpl[0]) {
            case 'view':
                var vmId = urlSpl[1];

                var vm = null;
                for(var ix = 0; ix < vms.length; ++ ix) {
                    if(!vms[ix] || !vms[ix].inf || vms[ix].inf.id !== vmId)
                        continue ;

                    vm = vms[ix];
                    break ;
                }

                if(!vm) {
                    res.setHeader('Content-Type', 'text/plain');
                    res.setHeader('Response-Code', '400');
                    res.end('Invalid vmId supplied.\nUsage: /view/[vmId]');
                } else {
                    vm.getPNG(function(buffer) {
                        res.setHeader('Content-Type', 'image/png');
                        res.setHeader('Content-Length', buffer.length);
                        res.end(buffer);
                    });
                }
                break ;

            default:
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Response-Code', '404');
                res.end('Oof. It seems you\'ve requested a page which doesn\'t exist.');
                break ;
        }
    });
    
    this.svr.on('listening', function() {
        console.info(logPre + 'HTTP Server listening on port ' + portNo + '!');
    });

    try {
        this.svr.listen(portNo);
    } catch(er) {
        console.warn(logPre + 'Failed to start HTTP Server on port ' + portNo + '!');
        console.warn(logPre + 'Do you have permission to access this port, or could it already be in use?');
        throw 'Unable to start HTTP Server; port ' + portNo + ' is unavailable.';
    }

    this.vms = vms;
};

module.exports = HTTPServ;