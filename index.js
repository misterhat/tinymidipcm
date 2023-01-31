import loadTinyMidiPCM from './tinymidipcm.mjs';

class TinyMidiPCM {
    constructor(options = {}) {
        this.wasmModule = undefined;

        this.soundfontBufferPtr = 0;
        this.soundfontPtr = 0;

        this.midiBufferPtr = 0;

        this.bufferSize = options.bufferSize || 1024 * 10; // 100 kb
        this.renderInterval = options.renderInterval || 100;

        this.sampleRate = options.sampleRate || 44100;
        this.channels = options.channels || 2;
        this.gain = options.gain || 0;
    }

    async init() {
        if (this.wasmModule) {
            return;
        }

        // check if node
        // http://philiplassen.com/2021/08/11/node-es6-emscripten.html
        if (typeof process !== 'undefined') {
            const { dirname } = await import(/* webpackIgnore: true */ 'path');
            const { createRequire } = await import(/* webpackIgnore: true */ 'module');

            globalThis.__dirname = dirname(import.meta.url);
            globalThis.require = createRequire(import.meta.url);
        }

        this.wasmModule = await loadTinyMidiPCM();

        this.pcmBufferPtr = this.wasmModule._malloc(this.bufferSize);
        this.msecsPtr = this.wasmModule._malloc(8);
    }

    ensureInitialized() {
        if (!this.wasmModule) {
            throw new Error(
                `${this.constructor.name} not initalized. call .init()`
            );
        }
    }

    setSoundfont(buffer) {
        this.ensureInitialized();

        const { _malloc, _free, _tsf_load_memory, _tsf_set_output, HEAPU8 } =
            this.wasmModule;

        _free(this.soundfontBufferPtr);

        this.soundfontBufferPtr = _malloc(buffer.length);
        HEAPU8.set(buffer, this.soundfontBufferPtr);

        this.soundfontPtr = _tsf_load_memory(this.soundfontBufferPtr,
                                            buffer.length);

        _tsf_set_output(
            this.soundfontPtr,
            this.channels === 2 ? 0 : 2,
            this.sampleRate,
            this.gain
        );
    }

    getMIDIMessagePtr(midiBuffer) {
        const { _malloc, _free, _tml_load_memory, HEAPU8 } = this.wasmModule;

        _free(this.midiBufferPtr);

        this.midiBufferPtr = _malloc(midiBuffer.length);
        HEAPU8.set(midiBuffer, this.midiBufferPtr);

        return _tml_load_memory(this.midiBufferPtr, midiBuffer.length);
    }

    renderMIDIMessage(midiMessagePtr) {
        const { _midi_render_short } = this.wasmModule;

        return _midi_render_short(this.soundfontPtr, midiMessagePtr, this.channels,
            this.sampleRate, this.pcmBufferPtr, this.bufferSize, this.msecsPtr);
    }

    render(midiBuffer, onPCMData) {
        this.ensureInitialized();

        if (!this.soundfontPtr) {
            throw new Error('no soundfont buffer set. call .setSoundfont');
        }

        const { setValue, HEAPU8, } = this.wasmModule;

        setValue(this.msecsPtr, 0, 'double');

        let midiMessagePtr = this.getMIDIMessagePtr(midiBuffer);

        let i = 0;

        const boundRender = function () {
            midiMessagePtr = this.renderMIDIMessage(midiMessagePtr);

            const pcm = (HEAPU8.subarray(this.pcmBufferPtr, this.pcmBufferPtr +
                        this.bufferSize));

            console.log(i);

            onPCMData(pcm);

            if (i < 50 && midiMessagePtr) {
                setTimeout(boundRender, this.renderInterval);
            }

            i++;
        }.bind(this);

        boundRender();

        /*
        let i = 0;
        const test = new Uint8Array(this.bufferSize * 50);

        do {
            midiMessagePtr
                = this.renderMIDIMessage(midiMessagePtr);

            const pcm = (HEAPU8.subarray(this.pcmBufferPtr, this.pcmBufferPtr +
                        this.bufferSize));

            test.set(pcm, i * (this.bufferSize));
            i++;

            if (i >= 50) {
                break;
            }
        } while (midiMessagePtr);

        onPCMData(test);*/
    }
}

export default TinyMidiPCM;
