# [Additive Synthesizer](https://additive-synth.netlify.app/)

![image](https://user-images.githubusercontent.com/9386882/95627899-005f4280-0a4b-11eb-8279-8bd50ce433ce.png)

This [Additive Synth](https://additive-synth.netlify.app/) is a timbral study. It consists of four oscillators and one noise source each routed to its own amplitude envelope. Oscillator 1 also controls the overall envelope - all other oscillators (including noise) are routed through Oscillator 1.

I wanted to replicate one of my favorite features of synths like Ableton's [Operator](https://www.ableton.com/en/packs/operator/) -- the ability to loop envelopes, letting you create detailed rhythmic textures. In addition to the base harmonic, volume, detune, wave type (sine, triangle, square, or sawtooth) and [ADSR envelope](<https://en.wikipedia.org/wiki/Envelope_(music)>), each oscillator also has a loop control, which determines the interval at which the envelope repeats.

I hoped to focus attention primarily on the timbre so I only added limited options for controlling the notes being played. The synth plays a sequence of 7th chord arpeggios in a set scale that can be changed by moving the mouse left and right. You can also change the octave by pressing `Z` and `X`. There are three "voices" meaning that three notes can be played at the same time.

For the visual feedback I mapped the averaged the output's Fourier transform to the color spectrum. This can be seen most easily by filtering out the high frequencies with the low pass filter which causes the color to become darker and redder.
