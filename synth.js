function Synth() {
  this.output = new Tone.Gain().connect(FX_BUS);
  const noiseSynth = new Tone.NoiseSynth({ volume: -Infinity });
  this.noiseSynthController = {
    noiseSynth,
    isLooping: false,
    loop: new Tone.Loop((time) => {
      noiseSynth.triggerAttack(time);
    }),
  };

  this.synths = [...new Array(NUM_OSCS)].map((_, i) => {
    const omniOsc = new Tone.OmniOscillator({
      type: "triangle",
      phase: (i / NUM_OSCS) * 360,
      volume: 0 - i * 2,
    });
    const env = new Tone.AmplitudeEnvelope({
      attack: 0.2,
      decay: 2,
      sustain: 1,
      release: 0,
    });

    omniOsc.chain(env);

    const loop = new Tone.Loop((time) => {
      env.triggerRelease();
      env.triggerAttack(time);
    });

    const isLooping = true;

    return { harmonic: i + 1, omniOsc, env, loop, isLooping };
  });

  // connect first to output
  this.synths[0].env.connect(this.output);

  // connect rest to previous one
  for (let i = 1; i < this.synths.length; i++) {
    this.synths[i].env.connect(this.synths[0].env);
  }

  this.noiseSynthController.noiseSynth.connect(this.synths[0].env);

  const getOscs = () => this.synths;

  return {
    getOscs,
    getNoiseSynthController: () => this.noiseSynthController,
    setOscType: (oscIndex, type) => {
      this.synths[oscIndex].omniOsc.set({ type });
    },
    setLoop: (oscIndex, interval) => {
      if (interval === "off") {
        this.synths[oscIndex].isLooping = false;
      } else {
        this.synths[oscIndex].loop.set({ interval });
        this.synths[oscIndex].isLooping = true;
      }
    },
    setHarmonic: (oscIndex, harmonic) => {
      this.synths[oscIndex].harmonic = harmonic;
    },
    setVolume: (oscIndex, volume) => {
      this.synths[oscIndex].omniOsc.volume.value =
        volume === -24 ? -Infinity : volume;
    },
    setDetune: (oscIndex, detune) => {
      this.synths[oscIndex].omniOsc.set({ detune });
    },
    setEnvValue: (oscIndex, param, val) => {
      this.synths[oscIndex].env[param] = val;
    },
    setNoiseVolume: (volume) => {
      this.noiseSynthController.noiseSynth.volume.value =
        volume === -24 ? -Infinity : volume;
    },
    setNoiseEnvValue: (param, val) => {
      this.noiseSynthController.noiseSynth.envelope[param] = val;
    },
    triggerAttack: (note, time) => {
      if (this.noiseSynthController.isLooping) {
        this.noiseSynthController.loop.cancel();
        this.noiseSynthController.loop.start();
      } else {
        this.noiseSynthController.loop.cancel();
        this.noiseSynthController.noiseSynth.triggerAttack(time);
      }

      getOscs().forEach(({ omniOsc, env, harmonic, loop }, i) => {
        const fq = note * (harmonic === 0 ? 0.5 : harmonic);
        omniOsc.frequency.value = fq;
        if (omniOsc.state === "stopped") {
          omniOsc.start(time);
        }

        if (isLooping) {
          loop.cancel();
          loop.start();
        } else {
          loop.cancel();
          env.triggerAttack(time);
        }
      });
    },
    triggerRelease: (time) => {
      this.noiseSynthController.noiseSynth.triggerRelease();
      getOscs().forEach(({ omniOsc, env }, i) => {
        env.triggerRelease();
      });
    },
  };
}
