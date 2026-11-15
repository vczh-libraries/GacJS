import { createRawCanvas } from './rawCanvas.js';

function paintTouching(context, _bounds, data) {
    const values = data.split(',').map(Number);
    if (values.length < 5 || !values.every(Number.isFinite) || values[4] < 0 || values[4] * 3 + 5 !== values.length) return;
    const [cx, cy, ax, ay] = values;
    context.fillStyle = '#87ceeb';
    context.beginPath();
    for (const [i, [x, y]] of [[-80, -50], [80, -50], [80, 50], [-80, 50]].entries()) {
        const px = cx + x * ax - y * ay;
        const py = cy + x * ay + y * ax;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
    }
    context.closePath();
    context.fill();
    context.strokeStyle = '#ffff00';
    context.lineWidth = 2;
    for (let i = 5; i < values.length; i += 3) {
        context.beginPath();
        context.arc(values[i + 1], values[i + 2], 16, 0, Math.PI * 2);
        context.stroke();
    }
}

// Touching deliberately keeps manual ID-based attachment without an interpretor.
export function installRawTouching(renderer) {
    const painters = new Map();
    let disposed = false;
    const remove = (raw, retainPicture = false) => {
        painters.get(raw)?.dispose(retainPicture);
        painters.delete(raw);
    };
    const update = raw => {
        if (disposed) return;
        if (raw.id !== 'FullControlTest.Touching') {
            remove(raw);
            return;
        }
        let painter = painters.get(raw);
        if (painter === undefined) {
            painter = createRawCanvas(raw, paintTouching);
            painters.set(raw, painter);
        } else {
            painter.draw();
        }
    };
    const subscriptions = [
        renderer.rawElementInstalled(update),
        renderer.rawElementUpdated(update),
        renderer.rawElementUninstalled(raw => remove(raw)),
    ];
    // Includes hidden elements and an already-started rvmhost renderer.
    for (const raw of renderer.getRawElements()) update(raw);
    return () => {
        if (disposed) return;
        disposed = true;
        for (const subscription of subscriptions) subscription.unsubscribe();
        for (const raw of painters.keys()) remove(raw, true);
    };
}
