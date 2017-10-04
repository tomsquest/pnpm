#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require("fs");
const gfs = require("graceful-fs");
gfs.gracefulify(fs);
const loudRejection = require("loud-rejection");
loudRejection();
const path = require("path");
const camelcase = require("camelcase");
const isCI = require("is-ci");
const nopt = require("nopt");
const R = require("ramda");
const npm = require("not-bundled-npm");
const npmDefaults = require("not-bundled-npm/lib/config/defaults");
require("../logging/fileLogger");
const pnpmPkgJson_1 = require("../pnpmPkgJson");
const pnpmCmds = require("../cmd");
const runNpm_1 = require("../cmd/runNpm");
const reporter_1 = require("../reporter");
const getCommandFullName_1 = require("../getCommandFullName");
const checkForUpdates_1 = require("../checkForUpdates");
pnpmCmds['install-test'] = pnpmCmds.installTest;
const supportedCmds = new Set([
    'add',
    'install',
    'uninstall',
    'update',
    'link',
    'prune',
    'install-test',
    'run',
    'store',
    'list',
    'dislink',
    'help',
    'root',
    'outdated',
    'rebuild',
]);
function run(argv) {
    return __awaiter(this, void 0, void 0, function* () {
        const pnpmTypes = {
            'store': path,
            'store-path': path,
            'global-path': path,
            'network-concurrency': Number,
            'fetching-concurrency': Number,
            'lock-stale-duration': Number,
            'lock': Boolean,
            'child-concurrency': Number,
            'offline': Boolean,
            'reporter': String,
            'independent-leaves': Boolean,
            'verify-store-integrity': Boolean,
        };
        const types = R.merge(npmDefaults.types, pnpmTypes);
        const cliConf = nopt(types, npmDefaults.shorthands, argv, 0 // argv should be already sliced by now
        );
        if (cliConf.version) {
            console.log(pnpmPkgJson_1.default.version);
            return;
        }
        if (!isCI) {
            checkForUpdates_1.default();
        }
        const cmd = getCommandFullName_1.default(cliConf.argv.remain[0]) || 'help';
        if (!supportedCmds.has(cmd)) {
            runNpm_1.default(argv);
            return Promise.resolve();
        }
        if (cliConf['dry-run']) {
            console.error(`Error: 'dry-run' is not supported yet, sorry!`);
            process.exit(1);
        }
        cliConf.save = cliConf.save || !cliConf.saveDev && !cliConf.saveOptional;
        if (!cliConf['user-agent']) {
            cliConf['user-agent'] = `${pnpmPkgJson_1.default.name}/${pnpmPkgJson_1.default.version} npm/? node/${process.version} ${process.platform} ${process.arch}`;
        }
        const force = cliConf['force'] === true;
        // removing force to avoid redundant logs from npm
        // see issue #878 and #877
        delete cliConf['force'];
        yield new Promise((resolve, reject) => {
            npm.load(cliConf, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        const silent = npm.config.get('loglevel') === 'silent' || !npm.config.get('reporter') && isCI;
        const opts = R.fromPairs(R.keys(types).map(configKey => [camelcase(configKey), npm.config.get(configKey)])); // tslint:disable-line
        opts.rawNpmConfig = Object.assign.apply(Object, npm.config['list'].reverse());
        opts.bin = npm.bin;
        opts.globalBin = npm.globalBin;
        opts.globalPrefix = path.join(npm['globalPrefix'], 'pnpm-global');
        opts.prefix = opts.global ? opts.globalPrefix : npm.prefix;
        opts.packageManager = pnpmPkgJson_1.default;
        opts.force = force;
        reporter_1.default(silent ? 'silent' : (opts.reporter || 'default')); // tslint:disable-line
        // `pnpm install ""` is going to be just `pnpm install`
        const cliArgs = cliConf.argv.remain.slice(1).filter(Boolean);
        return pnpmCmds[cmd](cliArgs, opts, cliConf.argv.remain[0]);
    });
}
const err_1 = require("../err");
if (!module.parent)
    run(process.argv.slice(2)).catch(err_1.default);
module.exports = run;
//# sourceMappingURL=pnpm.js.map