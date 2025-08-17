import * as SCHEMA from '@gaclib/remote-protocol';

export function renderUI(gacuiScreen: HTMLElement, trace: SCHEMA.UnitTest_RenderingTrace, frameIndex: number): void {
    gacuiScreen.innerHTML = `<h4>Frame Index: ${frameIndex}</h4>`;
}