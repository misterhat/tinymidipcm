# tinymidipcm

render MIDIs to PCM with custom soundfonts via tinysoundfont in WASM.

## example
```javascript
import TinyMidiPCM from 'tinymidipcm';

(async () => {
    const midiRes = await fetch('/e1m1.mid');
    const midiBuffer = new Uint8Array(await midiRes.arrayBuffer());

    const channels = 2;
    const sampleRate = 44100;

    let renderEndSeconds = 0;

    const tinyMidiPCM = new TinyMidiPCM({
        channels,
        sampleRate,
        renderInterval: 1000,
        onPCMData: (pcm) => player.feed(pcm),
        onRenderEnd: (ms) => {
            console.log('midi finished rendering.');

            renderEndSeconds = Math.floor(ms / 1000);
            console.log(renderEndSeconds, 'seconds');
        }
    });

    const pcmPlayerOptions = {
        inputCodec: 'Float32',
        channels,
        sampleRate,
        onended: async () => {
            const timeSeconds = Math.floor(
                player.audioCtx.currentTime
            );

            if (
                renderEndSeconds > 0 &&
                Math.abs(timeSeconds - renderEndSeconds) <= 2
            ) {
                console.log('midi finished playing.');
                renderEndSeconds = 0;
            }
        },
        flushTime: 1000
    };

    // https://www.npmjs.com/package/pcm-player
    const player = new PCMPlayer(pcmPlayerOptions);

    tinyMidiPCM.setBufferDuration(2);

    await tinyMidiPCM.init();

    const soundfontRes = await fetch('/scc1t2.sf2');

    const soundfontBuffer = new Uint8Array(
        await soundfontRes.arrayBuffer()
    );

    tinyMidiPCM.setSoundfont(soundfontBuffer);

    window.onclick = async () => {
        await player.pause();
        player.destroy();
        player.init(pcmPlayerOptions);

        player.volume(1);

        tinyMidiPCM.render(midiBuffer);
    };
})();
```

## api

### tinyMidiPCM = new TinyMidiPCM(options = {})

create a new rendering instance. options include:

* `bufferSize` PCM chunk size to render per `renderInterval`. default
to 1 second worth of data.
* `renderInterval` how often in ms to generate a new `bufferSize` PCM data
event. default `30`.
* `sampleRate` default `44100`.
* `channels` stereo or mono. default `2`.
* `gain` volume gain in decibels (>0 means higher, <0 means lower).
* `onPCMData` function callback wich emits a `Uint8Array` of PCM data at
`renderInterval` rate. encoded as 32 bit floats.
* `onRenderEnd` function callback when the entire MIDI is processed, providing
millseconds rendered argument.

### async tinyMidiPCM.init()

fetch and load the wasm. required for following methods.

### tinyMidiPCM.render(midiBuffer)

start emitting `onPCMData` callbacks. `midiBuffer` is a `Uint8Array` of a MIDI
file.

## license

> [TinySoundFont](https://github.com/schellingb/TinySoundFont) is available
> under the [MIT license](https://choosealicense.com/licenses/mit/).
