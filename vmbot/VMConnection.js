var rfb2 = require('rfb2'),
    canvas = require('canvas');

var logPre = '[VM] ';

function VMConnection(inf) {
    this.inf = inf;
    this.connection = null;

    this.canvas = canvas.createCanvas(1, 1);
    this.context = this.canvas.getContext('2d', { 'alpha': false });

    this.framebufferReqs = [ ];

    this.mouse = [ 0, 0 ];

    this.connect();
}

VMConnection.prototype.connect = function() {
    if(this.connection !== null)
        this.connection.end();

    this.connection = rfb2.createConnection({
        'host': this.inf.ip,
        'port': this.inf.port
    });

    var self = this;
    this.connection.on('rect', function(rect) {
        // refreshing screen
        if(rect.encoding !== rfb2.encodings.raw) return ; // oh

        // essentially loop through each
        while(self.framebufferReqs.length) {
            self.framebufferReqs[0](rect);
            self.framebufferReqs.splice(0, 1);
        }
    });

    this.connection.on('connect', function() {
        // eyy
        console.info(logPre + 'Connection to ' + self.inf.name + ' has been established.');
        self.resizeCanvas();
    });

    this.connection.on('error', function() {
        // oof
        console.info(logPre + self.inf.name + ' has encountered an error; reconnecting in 15s.');
        setTimeout(self.connect.bind(self), 15000);
    });

    this.connection.on('resize', function() {
        // "ah nice resolution setting okay FUCK i have to deal with that event too"
        console.info(
            logPre + self.inf.name + ' has changed screen resolutions to ' +
            self.getWidth() + 'x' + self.getHeight() + '.'
        );

        self.resizeCanvas();
    });
};

VMConnection.prototype.getFramebuffer = function(callback) {
    if(!callback) return ; // why bother?

    this.framebufferReqs.push(callback);

    if(this.framebufferReqs.length <= 1) {
        this.connection.requestUpdate(
            false, // incremental?
            0, 0, // top left x, y
            this.getWidth(), // sel wid
            this.getHeight() // sel hei
        );
    }
};

VMConnection.prototype.getPNG = function(callback) {
    var self = this;
    this.redrawCanvas(function() {
        callback(self.canvas.toBuffer('image/png'));
    });
};

VMConnection.prototype.getWidth = function() {
    return this.connection.width;
};

VMConnection.prototype.getHeight = function() {
    return this.connection.height;
};

VMConnection.prototype.getTitle = function() {
    return this.inf.name + ' [' + this.inf.hwinf.cpu + ', ' + this.inf.hwinf.ram + 'MB RAM]';
};

VMConnection.prototype.resizeCanvas = function(callback) {
    this.canvas.width = this.getWidth();
    this.canvas.height = this.getHeight();

    this.redrawCanvas(callback);
};

VMConnection.prototype.redrawCanvas = function(callback) {
    var self = this;
    this.getFramebuffer(function(fbuffr) {
        var imageData = self.context.getImageData(0, 0, self.canvas.width, self.canvas.height);

        // loop through the smaller dimension - this shouldn't be needed, but in the event
        // that the resize event doesn't fire, it'll at least prevent visual corruption of
        // the rendered framebuffer. creating the imagedata with the fbuffr resolution would
        // work just as well, but i prefer this approach personally.
        for(var y = 0; y < imageData.height && y < fbuffr.height; ++ y) {
            for(var x = 0; x < imageData.width && x < fbuffr.width; ++ x) {
                var pIx = 4 * (y * fbuffr.width + x);

                for(var chNo = 0; chNo < 3; ++ chNo) {
                    imageData.data[pIx + 2 - chNo] = fbuffr.data[pIx + chNo];
                }

                imageData.data[pIx + 3] = 255; // this also shouldn't be needed, but may as well
            }
        }

        self.context.putImageData(imageData, 0, 0);

        if(callback)
            callback();
    });
};

module.exports = VMConnection;