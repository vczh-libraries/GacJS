// Protocol_GlobalSetup.js
//
// Build GacUI once before Vitest starts the remote protocol test files.

import { ensureGacUIBuilt } from './Protocol_GacUIBuild.js';

export async function setup() {
    await ensureGacUIBuilt();
}

export default setup;
