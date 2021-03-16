var discord = require('discord.js');
var fs = require('fs');

var logPre = '[DiscordBot] ';

function DiscordBot(vms, cfg) {
    var token = (cfg && cfg.token) ? cfg.token : process.env.DISCORD_BOT_TOKEN;
    if(!token || token.length !== 59)
        throw 'No valid bot token supplied, cannot start bot!';

    this.keymap = null;
    
    try {
        this.keymap = JSON.parse(fs.readFileSync('keymap.json'));
    } catch(e) {
        console.error(logPre + 'Could not load keymap from keymap.json!');
        throw 'Failed to load required keymap.';
    }

    this.serverInfo = null;
    this.userInfo = null;

    this.dataFile = cfg.dataFile || './.data-discord-bot.json';

    try {
        var loadable = JSON.parse(fs.readFileSync(this.dataFile));
        this.serverInfo = loadable.serverInfo || { };
        this.userInfo = loadable.userInfo || { };
    } catch(e) {
        // ah okay new users are cool
        this.serverInfo = { };
        this.userInfo = { };
    }

    this.vms = vms;

    this.bot = new discord.Client();
    this.bot.login(token);

    var self = this;
    this.bot.on('message', function(msg) {
        if(msg.author.bot)
            return ;

        var pre = self.getServerInfo(msg.guild.id, 'prefix');
        if(!pre) {
            pre = '!';
            self.getServerInfo(msg.guild.id, 'prefix') = pre;
        }

        if(msg.content.indexOf(pre) !== 0)
            return ;

        self.handleCommand(msg, msg.content.replace(pre, '').split(' '));
    });
};

DiscordBot.prototype.handleCommand = function(msg, command) {
    var shouldSendScr = null;

    var commands = [
        {
            'cmd': 'prefix',
            'aliases': [ 'pre' ],
            'help': 'Change bot prefix [requires admin privs]',
            'disp': msg.member.hasPermission(8)
        },
        {
            'cmd': 'default-vm',
            'aliases': [ ],
            'help': 'Change default bot [requires admin privs]',
            'disp': msg.member.hasPermission(8)
        },
        {
            'cmd': 'reconnect-vm',
            'aliases': [ ],
            'help': 'Reconnect to a bot [requires admin privs]',
            'disp': msg.member.hasPermission(8)
        },
        {
            'cmd': 'list',
            'aliases': [ 'lis', 'ls', 'l' ],
            'help': 'List bots you can select and interact with.',
            'disp': true
        },
        {
            'cmd': 'select',
            'aliases': [ 'sel', 'change' ],
            'help': 'Select bot to interact with.',
            'disp': true
        },
        {
            'cmd': 'screen',
            'aliases': [ 'scr', 's' ],
            'help': 'View your selected VM\'s screen.',
            'disp': true
        },
        {
            'cmd': 'press',
            'aliases': [ 'p' ],
            'help': 'Press keys.',
            'disp': true
        },
        {
            'cmd': 'click',
            'aliases': [ 'c' ],
            'help': 'Press the mouse buttons.',
            'disp': true
        },
        {
            'cmd': 'type',
            'aliases': [ 't' ],
            'help': 'Press lots of buttons sequentially as to type.',
            'disp': true
        },
        {
            'cmd': 'mouse',
            'aliases': [ 'm' ],
            'help': 'Move the mouse.',
            'disp': true
        }
    ];

    switch(command[0]) {
        case 'prefix':
        case 'pre':
            shouldSendScr = this.commandPrefix(msg, command);
            break ;

        case 'default-vm':
            shouldSendScr = this.commandDefaultVM(msg, command);
            break ;

        case 'reconnect-vm':
            shouldSendScr = this.commandReconnectVM(msg, command);
            break ;

        case 'select':
        case 'sel':
        case 'change':
            shouldSendScr = this.commandSelect(msg, command);
            break ;

        case 'list':
        case 'lis':
        case 'ls':
        case 'l':
            shouldSendScr = this.commandList(msg, command);
            break ;

        case 'screen':
        case 'scr':
        case 's':
            shouldSendScr = { 'id': this.getActiveVM(msg) };
            break ;

        case 'press':
        case 'p':
            shouldSendScr = this.commandPress(msg, command);
            break ;

        case 'click':
        case 'c':
            shouldSendScr = this.commandClick(msg, command);
            break ;

        case 'type':
        case 't':
            shouldSendScr = this.commandType(msg, command);
            break ;

        case 'mouse':
        case 'm':
            shouldSendScr = this.commandMouse(msg, command);
            break ;

        default:
            var str = '';
        
            var n = 1;
            for(var ix = 0; ix < commands.length; ++ ix) {
                if(!commands[ix].disp)
                    continue ;
        
                str += n + '. `' + this.getServerInfo(msg.guild.id, 'prefix') + commands[ix].cmd + '`\n  ' +
                    commands[ix].help + '\n';
                n ++;
            }
        
            msg.channel.send('**Help Menu**\n' + str);
            break ;
    }

    if(!shouldSendScr)
        return ;

    var vm = this.getVmById(shouldSendScr.id);

    if(vm === null) {
        msg.channel.send('Failed to send screen for VM `' + shouldSendScr.id + '`!');
        return ;
    }

    setTimeout(function() {
        vm.getPNG(function(img) {
            var attachment = new discord.MessageAttachment(img);
            msg.channel.send(attachment);
        });
    }, shouldSendScr.timeout);
};

DiscordBot.prototype.getVmById = function(id) {
    var vm = null;

    for(var ix = 0; ix < this.vms.length; ++ ix) {
        if(!this.vms[ix] || !this.vms[ix].inf || this.vms[ix].inf.id !== id)
            continue ;

        vm = this.vms[ix];
        break ;
    }

    return vm;
};

DiscordBot.prototype.commandList = function(msg, command) {
    var ls = '';
    for(var ix = 0; ix < this.vms.length; ++ ix) {
        var s = ''; // sys inf
        s += '**' + this.vms[ix].inf.id + '**\n';
        s += 'Name: ' + this.vms[ix].inf.name + '\n';
        s += 'Arch: ' + this.vms[ix].inf.hwInf.cpu + '\n';
        s += 'RAM: ' + this.vms[ix].inf.hwInf.ram + 'MB\n';

        if(this.vms[ix].inf.hwInf.other)
            s += 'Info: ' + this.vms[ix].inf.hwInf.other + '\n';

        s += '\n';

        if(ls.length + s.length > 2000) {
            msg.channel.send(ls);
            ls = s;
        } else {
            ls += s;
        }
    }

    if(ls.length > 0)
        msg.channel.send(ls);
};

DiscordBot.prototype.commandSelect = function(msg, command) {
    if(command.length < 2) {
        msg.channel.send('Usage: `' + this.getServerInfo(msg.guild.id, 'prefix') + 'select [vmId]`\nRun `' + this.getServerInfo(msg.guild.id, 'prefix') + 'list` to list vmIds.');
        return ;
    }

    var vm = this.getVmById(command[1]);

    if(!vm) {
        msg.channel.send('Cannot find VM with vmId of `' +  command[1] + '`.\nRun `' + this.getServerInfo(msg.guild.id, 'prefix') + 'list` to list vmIds.');
        return ;
    }

    msg.channel.send('Selected ' + vm.inf.name + '!\nFrom now on, all commands you run through the bot will be fed through to this VM.');
    this.setActiveVM(msg, command[1]);
};

DiscordBot.prototype.commandPrefix = function(msg, command) {
    if(!msg.member.hasPermission(8)) {
        msg.channel.send('You need the **manage server** permission to change the bot\'s prefix.');
        return ;
    }

    if(command.length < 2) {
        msg.channel.send('The current prefix in this server is `' + this.getServerInfo(msg.guild.id, 'prefix') + '`.');
        return ;
    }

    msg.channel.send('Prefix has been changed from ' + this.getServerInfo(msg.guild.id, 'prefix') + ' to ' + command[1]);
    this.setServerInfo(msg.guild.id, 'prefix', command[1]);
};

DiscordBot.prototype.commandDefaultVM = function(msg, command) {
    if(!msg.member.hasPermission(8)) {
        msg.channel.send('You need the **manage server** permission to change the bot\'s default VM.');
        return ;
    }

    if(command.length < 2) {
        msg.channel.send('The current default VM in this server is `' + this.getServerInfo(msg.guild.id, 'default') + '`.');
        return ;
    }

    msg.channel.send('Default VM has been changed from ' + this.getServerInfo(msg.guild.id, 'default') + ' to ' + command[1]);
    this.setServerInfo(msg.guild.id, 'default', command[1]);
};

DiscordBot.prototype.commandReconnectVM = function(msg, command) {
    if(!msg.member.hasPermission(8)) {
        msg.channel.send('You need the **manage server** permission to restart the connection to a VM.');
        return ;
    }

    var all = false;

    if(command.length < 2) {
        msg.channel.send('Reconnecting all VMs.');
        all = true;
    } else {
        msg.channel.send('Reconnecting VM(s).');
    }

    var count = 0;
    for(var ix = 0; ix < this.vms.length; ++ ix) {
        if(all || command.indexOf(this.vms[ix].inf.id) > 0) {
            this.vms[ix].connect();
            ++ count;
        }
    }

    msg.channel.send('Reconnected ' + count + ' VM(s).' + (count === 0 ? '\nAre you sure you specified valid Bot IDs?' : ''));
};

DiscordBot.prototype.commandPress = function(msg, command) {
    if(command.length < 2) {
        msg.channel.send('Usage: `' + this.getServerInfo(msg.guild.id, 'prefix') + 'press [keyId]`\nValid keyIds: `' + Object.keys(keymap).join('`, `') + '`');
        return ;
    }

    var keys = command.slice(1);
    for(var ix = 0; ix < keys.length; ++ ix) {
        if(!this.keymap[keys[ix]]) {
            msg.channel.send('Unknown key `' + keys[ix] + '`.');
            return ;
        }

        keys[ix] = this.keymap[keys[ix]];
    }

    var conn = this.getVmById(this.getActiveVM(msg));

    if(!conn) {
        msg.channel.send('Failed to send key presses to VM!');
        return ;
    }

    for(var ix = 0; ix < keys.length; ++ ix) {
        setTimeout(function(i) {
            conn.connection.keyEvent(keys[i], 1);
        }, ix * 25, ix);

        setTimeout(function(i) {
            conn.connection.keyEvent(keys[i], 0);
        }, (keys.length + ix) * 25, ix);
    }

    return { 'id': this.getActiveVM(msg), 'timeout': 500 + (command.length + 1) * 25 };
};

DiscordBot.prototype.commandType = function(msg, command) {
    if(command.length < 2) {
        msg.channel.send('Usage: `' + this.getServerInfo(msg.guild.id, 'prefix') + 'type [text]`');
        return ;
    }

    var keys = command.slice(1).join(' ').split('');
    for(var ix = 0; ix < keys.length; ++ ix) {
        keys[ix] = this.keymap[keys[ix]];
    }

    var conn = this.getVmById(this.getActiveVM(msg));

    if(!conn) {
        msg.channel.send('Failed to send key presses to VM!');
        return ;
    }

    for(var ix = 0; ix < keys.length; ++ ix) {
        setTimeout(function(i) {
            conn.connection.keyEvent(keys[i], 1);
        }, ix * 30, ix);

        setTimeout(function(i) {
            conn.connection.keyEvent(keys[i], 0);
        }, ix * 30 + 15, ix);
    }

    return { 'id': this.getActiveVM(msg), 'timeout': 500 + keys.length * 40 };
};

DiscordBot.prototype.commandType = function(msg, command) {
    if(command.length < 2) {
        msg.channel.send('Usage: `' + this.getServerInfo(msg.guild.id, 'prefix') + 'type [text]`');
        return ;
    }

    var keys = command.slice(1).join(' ').split('');
    for(var ix = 0; ix < keys.length; ++ ix) {
        keys[ix] = this.keymap[keys[ix]];
    }

    var conn = this.getVmById(this.getActiveVM(msg));

    if(!conn) {
        msg.channel.send('Failed to send key presses to VM!');
        return ;
    }

    for(var ix = 0; ix < keys.length; ++ ix) {
        setTimeout(function(i) {
            conn.connection.keyEvent(keys[i], 1);
        }, ix * 30, ix);

        setTimeout(function(i) {
            conn.connection.keyEvent(keys[i], 0);
        }, ix * 30 + 15, ix);
    }

    return { 'id': this.getActiveVM(msg), 'timeout': 500 + keys.length * 40 };
};

DiscordBot.prototype.commandMouse = function(msg, command) {
    if(command.length < 3) {
        msg.channel.send('Usage:\n \\\u2022 `' + this.getServerInfo(msg.guild.id, 'prefix') +
            'mouse [x] [y]` (absolute positioning) or\n \\\u2022 `' + this.getServerInfo(msg.guild.id, 'prefix') +
            'mouse [up|down|left|right] [amount]` (relative positioning)');
        return ;
    }

    var vm = this.getVmById(this.getActiveVM(msg));

    if(command[1].match(/[0-9]/) !== null) {
        var x = parseInt(command[1]),
            y = parseInt(command[2]);

        if(!isNaN(x)) vm.mouse[0] = x;
        if(!isNaN(y)) vm.mouse[1] = y;
    } else {
        var ang = [ 'right', 'down', 'left', 'up' ],
            ix = ang.indexOf(command[1]) * Math.PI / 2;

        if(ix < 0) {
            msg.channel.send('Invalid direction!\nUsage for relative movements:\n \\\u2022 `' + this.getServerInfo(msg.guild.id, 'prefix') +
                'mouse [up|down|left|right] [amount]` (relative positioning)');
            return ;
        }

        var x = parseInt(command[2]) * Math.cos(ix),
            y = parseInt(command[2]) * Math.sin(ix);

        if(!isNaN(x)) vm.mouse[0] += x;
        if(!isNaN(y)) vm.mouse[1] += y;
    }

    vm.connection.pointerEvent(vm.mouse[0], vm.mouse[1], 0);

    return { 'id': this.getActiveVM(msg), 'timeout': 250 };
};

DiscordBot.prototype.commandClick = function(msg, command) {
    if(command.length > 1 && command[1].match(/^(l(eft|)|m(iddle)|r(ight|))$/) === null) {
        msg.channel.send('Usage: !click [l(eft)|m(iddle)|r(ight)|]');
        return ;
    }

    var vm = this.getVmById(this.getActiveVM(msg));

    var btn = 0;
    if(command.length > 1) {
        btn ^= 0b100 * (command[1][0] === 'r');
        btn ^= 0b10 * (command[1][0] === 'm');
        btn ^= 0b1 * (command[1][0] === 'l');
    } else {
        btn = 1;
    }

    vm.connection.pointerEvent(vm.mouse[0], vm.mouse[1], btn);
    setTimeout(vm.connection.pointerEvent.bind(vm.connection), 50, vm.mouse[0], vm.mouse[1], 0);

    return { 'id': this.getActiveVM(msg), 'timeout': 150 };
};

DiscordBot.prototype.getActiveVM = function(msg) {
    return this.userInfo[msg.author.id] || this.getServerInfo(msg.guild.id, 'default') || this.vms[0].id;
};

DiscordBot.prototype.setActiveVM = function(msg, val) {
    this.userInfo[msg.author.id] = val;
};

DiscordBot.prototype.getServerInfo = function(svrId, key) {
    var defaults = {
        'prefix': '!',
        'default': this.vms[0].inf.id
    };

    if(!this.serverInfo[svrId] || !this.serverInfo[svrId][key])
        return defaults[key] ;

    return this.serverInfo[svrId][key] ;
};

DiscordBot.prototype.setServerInfo = function(svrId, key, val) {
    if(!this.serverInfo[svrId])
        this.serverInfo[svrId] = { };

    this.serverInfo[svrId][key] = val;
};

DiscordBot.prototype.exit = function() {
    console.info(logPre + 'Saving bot data.');
    // this shouldn't take *too* long... unless the 
    // userbase grows considerably D:
    fs.writeFileSync(this.dataFile, JSON.stringify({
        'serverInfo': this.serverInfo,
        'userInfo': this.userInfo
    }));
};

module.exports = DiscordBot;
