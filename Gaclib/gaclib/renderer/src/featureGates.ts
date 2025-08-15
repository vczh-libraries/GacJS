export interface FeatureGates {
    useWebkitLineClamp?: boolean;
}

const featureGates: FeatureGates = {
    useWebkitLineClamp: false
};

export function getFeatureGates(): FeatureGates {
    return featureGates;
}

export function applyFeatureGates(gates: FeatureGates): void {
    if (gates.useWebkitLineClamp !== undefined) {
        featureGates.useWebkitLineClamp = gates.useWebkitLineClamp;
    }
}
