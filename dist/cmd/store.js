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
const supi_1 = require("supi");
const errorTypes_1 = require("../errorTypes");
const pnpm_logger_1 = require("pnpm-logger");
const help_1 = require("./help");
class StoreStatusError extends errorTypes_1.PnpmError {
    constructor(modified) {
        super('MODIFIED_DEPENDENCY', '');
        this.modified = modified;
    }
}
function default_1(input, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (input[0]) {
            case 'status':
                return statusCmd(opts);
            case 'prune':
                return supi_1.storePrune(opts);
            default:
                help_1.default(['store']);
        }
    });
}
exports.default = default_1;
function statusCmd(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const modifiedPkgs = yield supi_1.storeStatus(opts);
        if (!modifiedPkgs || !modifiedPkgs.length) {
            pnpm_logger_1.default.info('Packages in the store are untouched');
            return;
        }
        throw new StoreStatusError(modifiedPkgs);
    });
}
//# sourceMappingURL=store.js.map