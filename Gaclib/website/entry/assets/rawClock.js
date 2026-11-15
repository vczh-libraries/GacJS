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
    context.lineWidth = 2;
    context.strokeStyle = '#ffffff';
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();
    const line = (angle, start, end, color) => {
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(cx + Math.cos(angle) * radius * start, cy + Math.sin(angle) * radius * start);
        context.lineTo(cx + Math.cos(angle) * radius * end, cy + Math.sin(angle) * radius * end);
        context.stroke();
    };
    for (let i = 0; i < 12; i++) line(i * Math.PI / 6, 0.94, 1, '#ffffff');
    line((hour + minute / 60 + second / 3600) * Math.PI / 6 - Math.PI / 2, 0, 90 / 160, '#00ffff');
    line((minute + second / 60) * Math.PI / 30 - Math.PI / 2, 0, 110 / 160, '#00ff00');
    line(second * Math.PI / 30 - Math.PI / 2, 0, 130 / 160, '#ffff00');
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
