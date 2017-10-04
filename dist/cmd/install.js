"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supi_1 = require("supi");
const path = require("path");
const pnpm_logger_1 = require("pnpm-logger");
/**
 * Perform installation.
 * @example
 *     installCmd([ 'lodash', 'foo' ], { silent: true })
 */
function installCmd(input, opts) {
    // `pnpm install ""` is going to be just `pnpm install`
    input = input.filter(Boolean);
    const prefix = opts.prefix || process.cwd();
    opts['hooks'] = requireHooks(prefix);
    if (!input || !input.length) {
        return supi_1.install(opts);
    }
    return supi_1.installPkgs(input, opts);
}
exports.default = installCmd;
function requireHooks(prefix) {
    try {
        const pnpmFilePath = path.join(prefix, 'pnpmfile.js');
        const pnpmFile = require(pnpmFilePath);
        const hooks = pnpmFile && pnpmFile.hooks;
        if (!hooks)
            return {};
        if (hooks.readPackage) {
            if (typeof hooks.readPackage !== 'function') {
                throw new TypeError('hooks.readPackage should be a function');
            }
            pnpm_logger_1.default.info('readPackage hook is declared. Manifests of dependencies might get overridden');
        }
        return hooks;
    }
    catch (err) {
        if (err['code'] !== 'MODULE_NOT_FOUND')
            throw err;
        return {};
    }
}
//# sourceMappingURL=install.js.map