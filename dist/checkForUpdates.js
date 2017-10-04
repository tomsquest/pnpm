"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const updateNotifier = require("update-notifier");
const chalk = require("chalk");
const pnpmPkgJson_1 = require("./pnpmPkgJson");
const common_tags_1 = require("common-tags");
function default_1() {
    const notifier = updateNotifier({ pkg: pnpmPkgJson_1.default });
    const update = notifier.update;
    if (!update) {
        return;
    }
    const message = common_tags_1.stripIndents `
    Update available! ${chalk.red(update.current)} → ${chalk.green(update.latest)}
    ${chalk.magenta('Changelog:')} https://github.com/pnpm/pnpm/releases/tag/v${update.latest}
    Run ${chalk.magenta('npm i -g pnpm')} to update!

    Follow ${chalk.magenta('@pnpmjs')} for updates: https://twitter.com/pnpmjs
  `;
    notifier.notify({ message });
}
exports.default = default_1;
//# sourceMappingURL=checkForUpdates.js.map