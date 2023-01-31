# tinymidipcm

render MIDIs to PCM with custom soundfonts via tinysoundfont in WASM.

## example

## api

### tinyMidiPCM = new TinyMidiPCM(options = {})

create a new rendering instance. options include:

* `bufferSize` PCM chunk size to render per `renderInterval`. default
`1024 * 100`.
* `renderInterval` how often in ms to generate a new `bufferSize` PCM data
event. default `30`.
* `sampleRate` default `44100`.
* `channels` stereo or mono. default `2`.
* `gain` volume gain in decibels (>0 means higher, <0 means lower).

### async tinyMidiPCM.init()

fetch and load the wasm. required for following methods.

### tinyMidiPCM.render(midiBuffer)

### events

use with `addEventListener`. utilizes
[`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget).

* `data` emits a `Uint8Array` of PCM data at (most) `renderInterval` rate.
* `end` when finished.

## license

> [TinySoundFont](https://github.com/schellingb/TinySoundFont) is available
> under the [MIT license](https://choosealicense.com/licenses/mit/).
