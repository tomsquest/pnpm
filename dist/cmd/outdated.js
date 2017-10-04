"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const outdated_1 = require("@pnpm/outdated");
const table = require("text-table");
const chalk = require("chalk");
const stripColor = require("strip-color");
const LAYOUT_VERSION = '1';
function default_1(args, opts, command) {
    return __awaiter(this, void 0, void 0, function* () {
        let prefix;
        if (opts.global) {
            prefix = path.join(opts.prefix, LAYOUT_VERSION);
            if (opts.independentLeaves) {
                prefix += '_independent_leaves';
            }
        }
        else {
            prefix = opts.prefix;
        }
        const outdatedPkgs = args.length
            ? yield outdated_1.forPackages(args, prefix, opts)
            : yield outdated_1.default(prefix, opts);
        if (!outdatedPkgs.length)
            return;
        const columnNames = ['Package', 'Current', 'Wanted', 'Latest'].map(txt => chalk.underline(txt));
        console.log(table([columnNames].concat(outdatedPkgs.map(outdated => [
            chalk.yellow(outdated.packageName),
            outdated.current || 'missing',
            chalk.green(outdated.wanted),
            chalk.magenta(outdated.latest),
        ])), {
            stringLength: (s) => stripColor(s).length,
        }));
    });
}
exports.default = default_1;
//# sourceMappingURL=outdated.js.map