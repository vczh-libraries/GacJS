import { afterEach, test, expect } from 'vitest';
import { CORE_AUTOMATION_CONTROLS_URL, setupProtocolTest, describeProtocolTest, openControlTab,
    getLeafTextPositions, findTextInputPointRightOfLabel, findEditorCenter, clickAt, waitForIdle, findAndClick,
    observeProtocolEvents } from './Testing_Protocol.js';

function walk(node) { return [node, ...(node.children ?? []).flatMap(walk)]; }

async function coreDocuments() {
    const response = await fetch(CORE_AUTOMATION_CONTROLS_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Core controls HTTP ${response.status}`);
    const state = await response.json();
    const nodes = walk(state.MainWindow.composition);
    const search = nodes.filter(node => node.control === 'SinglelineTextBox').sort((a, b) => a.bounds.y1 - b.bounds.y1)[0];
    const editor = nodes.find(node => node.control === 'DocumentViewer');
    if (editor === undefined) throw new Error('Core did not expose the document editor.');
    return [search, editor].map(control => control === undefined ? null : walk(control).find(node => node.elementDocument !== undefined));
}

async function coreEditors(page) {
    const documents = (await coreDocuments()).map(node => node?.elementDocument ?? null);
    return page.evaluate(documents => documents.map(xml => {
        if (xml === null) return '';
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const content = doc.querySelector('Doc > Content');
        if (content === null) throw new Error('Core document XML has no content.');
        return Array.from(content.children).map(child => child.textContent).join('\n');
    }), documents);
}

for (const adapter of ['auto', 'contenteditable']) {
    describeProtocolTest(`BrowserEditing-${adapter}`, () => {
        let outgoing;
        const pageErrors = [];
        const ctx = setupProtocolTest({ setupPage: async page => {
            outgoing = observeProtocolEvents(page);
            page.on('pageerror', error => pageErrors.push(error.message));
            await page.addInitScript(adapter => {
                window.__gacui_text_input_options = { adapter };
                window.editingEvents = [];
                for (const name of ['compositionstart', 'compositionupdate', 'compositionend', 'beforeinput', 'input']) {
                    document.addEventListener(name, event => {
                        window.editingEvents.push({ name, data: event.data, inputType: event.inputType, isComposing: event.isComposing });
                        if (window.editingEvents.length > 80) window.editingEvents.shift();
                    }, true);
                }
            }, adapter);
        } });
        const expected = ['', ''];

        afterEach(async context => {
            if (context.task.result?.state === 'fail') {
                console.error('Live editing failure', { adapter, version: ctx.page.context().browser().version(), pageErrors,
                    input: outgoing.slice(-80), core: await coreDocuments(),
                    browser: await ctx.page.evaluate(() => ({ active: document.activeElement.outerHTML.slice(0, 500),
                        events: window.editingEvents, error: document.querySelector('#gacui-error-message')?.textContent })) });
            }
            expect(await ctx.page.locator('#gacui-error-mask').evaluate(mask => mask.classList.contains('visible'))).toBe(false);
        });

        test('engine insertion and forward/reversed selection replace exact Core ranges in both editors', async () => {
            const page = ctx.page;
            expect(await openControlTab(page)).toBe(true);
            const positions = await getLeafTextPositions(page);
            const label = positions.find(value => value.text.startsWith('Search'));
            const search = await findTextInputPointRightOfLabel(page, label);
            const editor = await findEditorCenter(page);
            for (const [index, point] of [search, editor].entries()) {
                await clickAt(page, point.x ?? point.cx, point.y ?? point.cy);
                await page.keyboard.press('Home');
                await page.keyboard.press('Shift+End');
                await page.keyboard.insertText('ABCD');
                expected[index] = 'ABCD';
                await expect.poll(async () => (await coreEditors(page))[index], { timeout: 10000 }).toBe(expected[index]);
                await waitForIdle(page);
                await page.keyboard.press('Home');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('Shift+ArrowRight');
                await page.keyboard.press('Shift+ArrowRight');
                await page.keyboard.insertText('中🙂');
                expected[index] = 'A中🙂D';
                await expect.poll(async () => (await coreEditors(page))[index], { timeout: 10000 }).toBe(expected[index]);
                await waitForIdle(page);
                await page.keyboard.press('End');
                await page.keyboard.press('Shift+ArrowLeft');
                await page.keyboard.insertText('终');
                expected[index] = 'A中🙂终';
                await expect.poll(async () => (await coreEditors(page))[index], { timeout: 10000 }).toBe(expected[index]);
                await waitForIdle(page);
            }
            expect(pageErrors).toEqual([]);
        });

        test('engine IME insertion, selected replacement and cancellation preserve Core ownership', async () => {
            const page = ctx.page;
            const cdp = await page.context().newCDPSession(page);
            const positions = await getLeafTextPositions(page);
            const search = await findTextInputPointRightOfLabel(page, positions.find(value => value.text.startsWith('Search')));
            const editor = await findEditorCenter(page);
            const compose = text => cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
            for (const [index, point] of [search, editor].entries()) {
                await clickAt(page, point.x ?? point.cx, point.y ?? point.cy);
                await page.keyboard.press('Control+End');
                await waitForIdle(page);
                const before = outgoing.filter(event => event.name === 'IOChar').length;
                await compose('n'); await compose('ni');
                expect((await coreEditors(page))[index]).toBe(expected[index]);
                expect(outgoing.filter(event => event.name === 'IOChar').length).toBe(before);
                await cdp.send('Input.insertText', { text: '你' });
                expected[index] += '你';
                await expect.poll(async () => (await coreEditors(page))[index], { timeout: 10000 }).toBe(expected[index]);
                await waitForIdle(page);
                await page.keyboard.press('Home');
                await page.keyboard.press('Shift+End');
                await waitForIdle(page);
                const selection = (await coreDocuments())[index].element;
                await compose('quxiao'); await compose('');
                expect((await coreEditors(page))[index]).toBe(expected[index]);
                expect((await coreDocuments())[index].element).toBe(selection);
                // Cancellation must preserve the selection: the next commit replaces all.
                await compose('hao');
                await cdp.send('Input.insertText', { text: '好🙂' });
                expected[index] = '好🙂';
                await expect.poll(async () => (await coreEditors(page))[index], { timeout: 10000 }).toBe(expected[index]);
                await waitForIdle(page);
            }
            expect(await findAndClick(page, 'List', await getLeafTextPositions(page))).toBe(true);
            expect(await openControlTab(page)).toBe(true);
            expect(await coreEditors(page)).toEqual(expected);
            expect(pageErrors).toEqual([]);
        });

        test('clipboard shortcuts share Core clipboard with Copy and Cut', async () => {
            const page = ctx.page;
            const editor = await findEditorCenter(page);
            await clickAt(page, editor.cx, editor.cy);
            await page.keyboard.press('Control+Home');
            await page.keyboard.press('Control+Shift+End');
            const text = 'Clipboard🙂';
            await page.keyboard.insertText(text);
            await expect.poll(async () => (await coreEditors(page))[1]).toBe(text);
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Control+c');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('Control+v');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe(text + text);
            await page.keyboard.press('Control+z');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe(text);
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Control+x');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe('');
            await page.keyboard.press('Control+v');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe(text);
            expected[1] = text;
            expect(pageErrors).toEqual([]);
        });

        test('multi-paragraph selection, undo/redo and Toolstrip edit modes keep Core authoritative', async () => {
            const page = ctx.page;
            const cdp = await page.context().newCDPSession(page);
            const compose = text => cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
            const editor = await findEditorCenter(page);
            await clickAt(page, editor.cx, editor.cy);
            await page.keyboard.press('Control+Home');
            await page.keyboard.press('Control+Shift+End');
            await page.keyboard.insertText('First');
            await page.keyboard.press('Enter');
            await page.keyboard.insertText('Second');
            await page.keyboard.press('Enter');
            await page.keyboard.insertText('Third');
            const original = 'First\nSecond\nThird';
            await expect.poll(async () => (await coreEditors(page))[1]).toBe(original);
            await page.keyboard.press('Control+Home');
            await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
            for (let i = 0; i < 7; i++) await page.keyboard.press('Shift+ArrowRight');
            await waitForIdle(page);
            const selection = (await coreDocuments())[1].element;
            await compose('cancel'); await compose('');
            expect((await coreDocuments())[1].element).toBe(selection);
            expect((await coreEditors(page))[1]).toBe(original);
            await compose('zhong'); await cdp.send('Input.insertText', { text: '中' });
            await expect.poll(async () => (await coreEditors(page))[1]).toBe('Fi中ond\nThird');
            await page.keyboard.press('Control+z');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe(original);
            await page.keyboard.press('Control+y');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe('Fi中ond\nThird');

            expect(await findAndClick(page, 'Document Editor (Toolstrip)', await getLeafTextPositions(page))).toBe(true);
            const toolstrip = await findEditorCenter(page);
            await clickAt(page, toolstrip.cx, toolstrip.cy);
            await page.keyboard.insertText('One');
            await page.keyboard.press('Enter');
            await page.keyboard.insertText('Two');
            await expect.poll(async () => (await coreEditors(page))[1]).toBe('One\nTwo');
            expect(await page.evaluate(() => document.activeElement.hasAttribute('data-gacui-input'))).toBe(true);
            for (const mode of ['Selectable', 'Preview', 'Editable']) {
                expect(await findAndClick(page, 'View', await getLeafTextPositions(page))).toBe(true);
                await page.locator('#gacui-screen').getByText(mode, { exact: true }).waitFor({ state: 'visible' });
                expect(await findAndClick(page, mode, await getLeafTextPositions(page))).toBe(true);
                await clickAt(page, toolstrip.cx, toolstrip.cy);
                expect(await page.evaluate(() => document.activeElement.hasAttribute('data-gacui-input'))).toBe(mode === 'Editable');
                await page.keyboard.insertText(mode === 'Editable' ? '终' : 'WRONG');
                if (mode !== 'Editable') expect((await coreEditors(page))[1]).toBe('One\nTwo');
            }
            await expect.poll(async () => (await coreEditors(page))[1]).toContain('终');
            expect((await coreEditors(page))[1]).not.toContain('WRONG');
            expect(pageErrors).toEqual([]);
        });
    });
}
