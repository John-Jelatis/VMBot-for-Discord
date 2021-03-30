/*
 * I went through great hassle to make
 * sure the entire codebase would work
 * in *old* versions of nodejs in which
 * ES6 has not been implemented yet;
 * It could run on a host with Windows
 * XP or some shit.
 * 
 * Please respect that fact and keep the
 * codebase compatible. Thank you.
 * 
 * John Jelatis <john.jelatis@gmail.com>
 *
 */

var fs = require('fs');

var VMConnection = require('./VMConnection.js');
var config;

try {
  config = JSON.parse(fs.readFileSync('./config.json'));
} catch(er) {
  console.error('Unable to load configuration file!');
  process.exit(1);
}

var vms = [ ];
for(var ix = 0; ix < config.vms.length; ++ ix) {
    var conn = new VMConnection(config.vms[ix]);
    vms.push(conn);
}

var modules = { };
var startModule = function(ix, dep) {
    var logPre = '[ModuleManager] ';
    try {
        var cfg = null;
        try {
            cfg = JSON.parse(fs.readFileSync('./config-' + config.modules[ix] + '.json'));
        } catch(er) {
            // there isn't really anything else to do
            // the modules should be programmed as to
            // cope, and if they aren't, that's because
            // your dumbass didn't follow the spec
            // that i just made up.
        }

        var Module = require('./modules/' + config.modules[ix]);
        var mod = new Module(vms, cfg);

        console.info(logPre + 'Loaded module ' + config.modules[ix] + ' successfully.')

        modules[config.modules[ix]] = mod;
    } catch(er) {
        if(dep <= 0) {
            console.warn(logPre + 'Welp, module ' + config.modules[ix] + ' has killed itself. Bye-bye, shitfuck of a module.');
            console.warn(logPre + 'Error thrown: ' + (er.stack || er));

            return ;
        }

        console.warn(logPre + 'Module ' + config.modules[ix] + ' has thrown an error; relaunching in 5 seconds.');
        console.warn(logPre + 'Error thrown: ' + (er.stack || er));
        setTimeout(startModule.bind(null, ix), 5000, dep - 1);
    }
};

for(var ix = 0; ix < config.modules.length; ++ ix) {
    // if it crashes more than 10 times, then something is really wrong.
    startModule(ix, 10);
}

var safeExit = function() {
    var keys = Object.keys(modules);

    for(var ix = 0; ix < keys.length; ++ ix)
        if(modules[keys[ix]] && modules[keys[ix]].exit)
            modules[keys[ix]].exit();

    process.exit(0);
};

process.on('beforeExit', safeExit);
process.on('SIGINT', safeExit);

// lmao rather be safe than sorry
// imma be sorry though once i get spammed because of this
// on discord D:
process.on('uncaughtException', function(err) {
    console.error('');
    console.error('>> - --==============-- - <<');
    console.error('>> UNCAUGHT ERROR THROWN! <<');
    console.error('>> - --==============-- - <<');
    console.error('>> ENSURE THAT YOU AREN\'T <<');
    console.error('>> THE CAUSE OF THE PROB. <<');
    console.error('>> - --==============-- - <<');
    console.error('>>  IF YOU AREN\'T,  THEN  <<');
    console.error('>> - -- - -  --  - - -- - <<');
    console.error('>> PLEASE REPORT THE INFO <<');
    console.error('>> BELOW  TO  @Frank#9112 <<');
    console.error('>>      ON  DISCORD!      <<');
    console.error('>> - --==============-- - <<');
    console.error('');
    console.error(err.stack || err);
    console.error('');

    if(config.exitOnError) process.exit();
});
