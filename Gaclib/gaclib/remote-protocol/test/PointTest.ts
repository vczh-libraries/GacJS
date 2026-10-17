import { EventToJson, IOPointAction, IOPointEndReason, ProtocolInvoking } from '../src/index';
import { expect, test } from 'vitest';

test('generated point events retain every field, unsigned decimal strings and nullable zero', () => {
    const sent: ProtocolInvoking[] = [];
    const events = new EventToJson(message => sent.push(JSON.parse(JSON.stringify(message)) as ProtocolInvoking));
    const sample: IOPointAction = {
        eventIndex: 0,
        info: {
            sequenceId: '18446744073709551615', pointId: 0, timestamp: '9007199254740993', activePointCount: 1,
            position: { x: { value: -40 }, y: { value: 300 } }, primary: true,
            ctrl: true, shift: true, alt: true, osSuper: true,
            contactBounds: { x1: { value: -44 }, y1: { value: 295 }, x2: { value: -36 }, y2: { value: 305 } },
            pressure: 0.75, orientation: 1.25, platformFrameId: '18446744073709551615'
        }
    };
    for (const frame of [null, '0', '4294967295', '9007199254740993', '18446744073709551615']) {
        sample.info.platformFrameId = frame;
        sample.eventIndex = 0;
        events.OnIOPointStarted(sample);
        events.OnIOPointDown({ ...sample, eventIndex: 1 });
        events.OnIOPointUpdate({ ...sample, eventIndex: 2 });
        events.OnIOPointEnter({ ...sample, eventIndex: 3 });
        events.OnIOPointLeave({ ...sample, eventIndex: 4 });
        events.OnIOPointUp({ ...sample, eventIndex: 5, info: { ...sample.info, activePointCount: 0 } });
        events.OnIOPointEnded({ sequenceId: sample.info.sequenceId, eventIndex: 6, timestamp: sample.info.timestamp,
            accepted: false, reason: IOPointEndReason.Canceled_CaptureLost });
        const group = sent.splice(0);
        expect(group.map(item => item.name)).toEqual(['IOPointStarted','IOPointDown','IOPointUpdate','IOPointEnter','IOPointLeave','IOPointUp','IOPointEnded']);
        expect(group[0].arguments).toEqual(sample);
        expect(group[5].arguments).toEqual({ ...sample, eventIndex: 5, info: { ...sample.info, activePointCount: 0 } });
        expect(group[6].arguments).toEqual({ sequenceId: '18446744073709551615', eventIndex: 6,
            timestamp: '9007199254740993', accepted: false, reason: 'Canceled_CaptureLost' });
    }
});
