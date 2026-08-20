export function assertSupportedNodeVersion(version) {
    const match = /^v(\d+)\.(\d+)\.(\d+)(?:-|$)/u.exec(version);
    if (match === null) {
        throw new Error(`gacjs-rvmhost SEA cannot parse the Node version: ${version}.`);
    }
    const major = Number(match[1]);
    const minor = Number(match[2]);
    if (!((major === 22 && minor >= 20) || major === 24)) {
        throw new Error(`gacjs-rvmhost SEA requires Node >=22.20 <23 or >=24 <25; received ${version}.`);
    }
}

export function assertSeaToolchain(version, supportsSeaConfig, injectFunction) {
    assertSupportedNodeVersion(version);
    if (!supportsSeaConfig) {
        throw new Error(`gacjs-rvmhost SEA cannot use ${version}: --experimental-sea-config is unavailable.`);
    }
    if (typeof injectFunction !== 'function') {
        throw new Error('gacjs-rvmhost SEA cannot inject NODE_SEA_BLOB: the postject tool is unavailable.');
    }
}
