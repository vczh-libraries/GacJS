import { createRawCanvas } from './rawCanvas.js';

const clockInterpretor = 'FullControlTest::Clock';

function paintClock(context, bounds, data) {
    const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(data);
    if (match === null) return;
    const [hour, minute, second] = match.slice(1).map(Number);
    if (hour >= 24 || minute >= 60 || second >= 60) return;
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2 - 10;
    if (radius <= 0) return;

    const addLine = (path, angle, start, end) => {
        path.moveTo(cx + Math.cos(angle) * radius * start, cy + Math.sin(angle) * radius * start);
        path.lineTo(cx + Math.cos(angle) * radius * end, cy + Math.sin(angle) * radius * end);
    };
    const face = new Path2D();
    face.arc(cx, cy, radius, 0, Math.PI * 2);
    for (let i = 0; i < 12; i++) addLine(face, i * Math.PI / 6, 0.94, 1);
    const hand = (angle, length) => {
        const path = new Path2D();
        addLine(path, angle - Math.PI / 2, 0, length);
        return path;
    };
    const strokes = [
        [face, '#ffffff'],
        [hand((hour + minute / 60 + second / 3600) * Math.PI / 6, 90 / 160), '#00ffff'],
        [hand((minute + second / 60) * Math.PI / 30, 110 / 160), '#00ff00'],
        [hand(second * Math.PI / 30, 130 / 160), '#ffff00'],
    ];
    const outline = new Path2D();
    for (const [path] of strokes) outline.addPath(path);
    context.lineWidth = 3;
    context.strokeStyle = '#000000';
    context.stroke(outline);
    context.lineWidth = 2;
    for (const [path, color] of strokes) {
        context.strokeStyle = color;
        context.stroke(path);
    }
}

// Register before protocol delivery. Each raw element gets an independent painter.
export function installRawClock(renderer) {
    renderer.registerRawElementInterpretorFactory(clockInterpretor, {
        create() {
            let raw;
            let painter;
            let subscription;
            return {
                initialize(element) {
                    raw = element;
                    painter = createRawCanvas(raw, paintClock);
                    subscription = renderer.rawElementUpdated(updated => {
                        if (updated === raw) painter.draw();
                    });
                },
                finalize() {
                    subscription?.unsubscribe();
                    // Stop retains the record/name and last picture. A name change or
                    // protocol destruction removes this painter's canvas only.
                    painter?.dispose(raw.interpretor === clockInterpretor && renderer.getRawElements().includes(raw));
                    painter = undefined;
                },
            };
        },
    });
}
