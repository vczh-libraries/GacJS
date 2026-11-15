// Shared canvas sizing and observation; painters only interpret the received data.
export function createRawCanvas(raw, paint) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;min-width:0;min-height:0;pointer-events:none';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    let disposed = false;
    let redrawFrame;
    let resolution;
    const cancelRedraw = () => {
        if (redrawFrame !== undefined) cancelAnimationFrame(redrawFrame);
        redrawFrame = undefined;
    };
    const draw = (retryLayout = true) => {
        if (disposed || context === null) return;
        const bounds = raw.element.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) {
            // A batch can detach/update/reattach at the same size without a resize.
            if (retryLayout && redrawFrame === undefined) {
                redrawFrame = requestAnimationFrame(() => {
                    redrawFrame = undefined;
                    draw(false);
                });
            }
            return;
        }
        cancelRedraw();
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(bounds.width * ratio));
        const height = Math.max(1, Math.round(bounds.height * ratio));
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, bounds.width, bounds.height);
        paint(context, bounds, raw.data);
    };
    const redraw = () => draw();
    const watchResolution = () => {
        resolution?.removeEventListener('change', watchResolution);
        if (disposed) return;
        resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        resolution.addEventListener('change', watchResolution);
        draw();
    };
    const observer = new ResizeObserver(redraw);
    raw.element.appendChild(canvas);
    observer.observe(raw.element);
    window.addEventListener('resize', redraw);
    watchResolution();
    return {
        draw,
        dispose(retainPicture = false) {
            if (disposed) return;
            disposed = true;
            observer.disconnect();
            cancelRedraw();
            window.removeEventListener('resize', redraw);
            resolution?.removeEventListener('change', watchResolution);
            if (!retainPicture) canvas.remove();
        },
    };
}
