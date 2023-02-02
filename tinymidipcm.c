#include <stdint.h>
#include <stdlib.h>

#define TSF_IMPLEMENTATION
#include "tsf.h"

#define TML_IMPLEMENTATION
#include "tml.h"

tml_message *midi_render(tsf *soundfont, tml_message *midi_message,
                               int channels, int sample_rate,
                               uint8_t *buffer, int pcm_length, double *msecs) {
    int block_size = TSF_RENDER_EFFECTSAMPLEBLOCK;
    int bytes_written = 0;

    do {
        *msecs += block_size * (1000.0 / (float)sample_rate);

        while (midi_message && *msecs >= midi_message->time) {
            switch (midi_message->type) {
            case TML_PROGRAM_CHANGE:
                tsf_channel_set_presetnumber(soundfont, midi_message->channel,
                                             midi_message->program,
                                             (midi_message->channel == 9));
                break;
            case TML_NOTE_ON:
                tsf_channel_note_on(soundfont, midi_message->channel,
                                    midi_message->key,
                                    midi_message->velocity / 127.0f);
                break;
            case TML_NOTE_OFF:
                tsf_channel_note_off(soundfont, midi_message->channel,
                                     midi_message->key);
                break;
            case TML_PITCH_BEND:
                tsf_channel_set_pitchwheel(soundfont, midi_message->channel,
                                           midi_message->pitch_bend);
                break;
            case TML_CONTROL_CHANGE:
                tsf_channel_midi_control(soundfont, midi_message->channel,
                                         midi_message->control,
                                         midi_message->control_value);
                break;
            }

            midi_message = midi_message->next;
        }

        /*tsf_render_short(soundfont, (int16_t *)(buffer + bytes_written),
                         block_size, 0);

        bytes_written += block_size * 2 * channels;*/

        tsf_render_float(soundfont, (float *)(buffer + bytes_written),
                         block_size, 0);

        bytes_written += block_size * 4 * channels;
    } while (bytes_written < pcm_length);

    return midi_message;
}

#if 0
#include <stdio.h>

#define SAMPLE_RATE 44100
#define CHANNELS 2

int main(int argc, char **argv) {
    int soundfont_length = 3281786;
    FILE *soundfont_file = fopen("./scc1t2.sf2", "r");

    uint8_t *soundfont_buffer = malloc(soundfont_length);
    fread(soundfont_buffer, soundfont_length, 1, soundfont_file);
    fclose(soundfont_file);

    int midi_length = 23708;
    FILE *midi_file = fopen("./e1m1.mid", "r");
    uint8_t *midi_buffer = malloc(midi_length);
    fread(midi_buffer, midi_length, 1, midi_file);
    fclose(midi_file);

    tsf *soundfont = tsf_load_memory(soundfont_buffer, soundfont_length);
    tsf_set_output(soundfont, TSF_STEREO_INTERLEAVED, SAMPLE_RATE, 0.0f);
    //tsf_set_output(soundfont, TSF_MONO, SAMPLE_RATE, 0.0f);

    tml_message *midi_message = tml_load_memory(midi_buffer, midi_length);

    double msecs = 0;
    FILE *test = fopen("./out.pcm", "a+");

    int samples = 4*SAMPLE_RATE*CHANNELS;
    uint8_t *pcm_buffer = malloc(samples);


    do {
        midi_message = midi_render(soundfont, midi_message,
                                    CHANNELS, SAMPLE_RATE,
                                     pcm_buffer, samples, &msecs);

        fwrite(pcm_buffer, samples, 1, test);
    } while (midi_message != NULL);

    // cat out.pcm | aplay -c2 -f FLOAT_LE -r 44100
}
#endif
