Tone.context.latencyHint = "playback";

let synth;
let synth1;
let synth2;
let chordIndex = 0;
let octaveMultiplier = 1;
let chordNoteIndex = 0;
let destinationGain = 0.3;

const NUM_OSCS = 4;

const fft = new Tone.FFT();

const autoFilter = new Tone.AutoFilter(1).start();
const scale = teoria.note("a").scale("major");
const hpFilter = new Tone.Filter({
  frequency: 5,
  type: "highpass",
});
const lpFilter = new Tone.Filter(20000, "lowpass");
const cheby = new Tone.Chebyshev({ order: 2, wet: 0 });

const SYNTH_DROPDOWNS = [
  {
    label: "Type",
    options: ["sine", "triangle", "square", "sawtooth"],
    getVal: (synth) => {
      // console.log(synth.omniOsc.get("type").type);
      return synth.omniOsc.get("type").type;
    },
    onChange: (synth, val) => {
      synth.omniOsc.set({ type: val });
      console.log(val);
    },
  },
  {
    label: "Loop",
    options: ["off", "16n", "16t", "32n"],
    getVal: (synth) => {
      // console.log(synth.omniOsc.get("type").type);
      return synth.omniOsc.get("type").type;
    },
    onChange: (synth, val) => {
      if (val === "off") {
        synth.isLooping = false;
      } else {
        synth.loop.set({ interval: val });
        synth.isLooping = true;
      }
    },
  },
];

const NOISE_DROPDOWNS = [
  {
    label: "Type",
    options: ["white", "pink", "brown"],
    getVal: ({ noiseSynth }) => noiseSynth.noise.type,
    onChange: ({ noiseSynth }, val) => {
      noiseSynth.noise.set({ type: val });
    },
  },
  {
    label: "Loop",
    options: ["off", "16n", "16t", "32n"],
    getVal: (noiseSynthController) => {
      return noiseSynthController.loop.get("interval") || "off";
    },
    onChange: (noiseSynthController, val) => {
      if (val === "off") {
        noiseSynthController.isLooping = false;
      } else {
        noiseSynthController.loop.set({ interval: val });
        noiseSynthController.isLooping = true;
      }
    },
  },
];

const SYNTH_SLIDERS = [
  {
    label: "Base",
    min: 0,
    max: 10,
    getVal: (synth) => synth.harmonic,
    onChange: (synth, val) => {
      synth.harmonic = val;
    },
  },
  {
    label: "Volume",
    min: -24,
    max: 0,
    getVal: (synth) => {
      const vol = synth.omniOsc.volume.value;
      return vol === -Infinity ? -24 : vol;
    },
    onChange: (synth, val) => {
      synth.polySynth.volume.value = val === -24 ? -Infinity : val;
      synth.omniOsc.volume.value = val === -24 ? -Infinity : val;
    },
  },
  {
    label: "Detune",
    min: -20,
    max: 20,
    getVal: (synth) => {
      return synth.omniOsc.detune.value;
    },
    // onChange: (synth, val) => synth.osc.set({ detune: val }),
    onChange: (synth, val) => {
      synth.polySynth.set({ detune: val });
      synth.omniOsc.set({ detune: val });
    },
  },
  {
    label: "A",
    min: 1,
    max: 200,
    getVal: (synth) => {
      // return synth.polySynth.get("envelope").envelope.attack * 100
      return synth.env.get("attack").attack * 100;
    },
    onChange: (synth, val) => {
      synth.env.attack = val / 100;
      synth.polySynth.set({ envelope: { attack: val / 100 } });
    },
  },
  {
    label: "D",
    min: 1,
    max: 200,
    getVal: (synth) => {
      // return synth.osc.get("envelope").envelope.decay * 100;
      return synth.env.get("decay").decay * 100;
    },
    onChange: (synth, val) => {
      synth.env.decay = val / 100;
      synth.polySynth.set({ envelope: { decay: val / 100 } });
    },
  },
  {
    label: "S",
    min: 1,
    max: 100,
    getVal: (synth) => {
      // return synth.polySynth.get("envelope").envelope.sustain * 100
      return synth.env.get("sustain").sustain * 100;
    },
    onChange: (synth, val) => {
      synth.env.sustain = val / 100;
      synth.polySynth.set({ envelope: { sustain: val / 100 } });
    },
  },
  {
    label: "R",
    min: 0,
    max: 200,
    getVal: (synth) => {
      // return synth.polySynth.get("envelope").envelope.release * 100
      return synth.env.get("release").release * 100;
    },
    onChange: (synth, val) => {
      console.log(val);
      synth.env.release = val / 100;
      synth.polySynth.set({ envelope: { release: val / 100 } });
    },
  },
];

const NOISE_SLIDERS = [
  {
    label: "Volume",
    min: -24,
    max: 0,
    getVal: (noiseSynth) => {
      const vol = noiseSynth.volume.value;
      return vol === -Infinity ? -24 : vol;
    },
    onChange: (noiseSynth, val) => {
      noiseSynth.volume.value = val === -24 ? -Infinity : val;
    },
  },
  {
    label: "A",
    min: 1,
    max: 200,
    getVal: (noiseSynth) => noiseSynth.envelope.get("attack").attack / 100,
    onChange: (noiseSynth, val) => {
      noiseSynth.set({ envelope: { attack: val / 100 } });
    },
  },
  {
    label: "D",
    min: 1,
    max: 200,
    getVal: (noiseSynth) => noiseSynth.envelope.get("decay").decay / 100,
    onChange: (noiseSynth, val) => {
      noiseSynth.set({ envelope: { decay: val / 100 } });
    },
  },
  {
    label: "S",
    min: 1,
    max: 100,
    getVal: (noiseSynth) => noiseSynth.envelope.get("sustain").sustain / 100,
    onChange: (noiseSynth, val) => {
      noiseSynth.set({ envelope: { sustain: val / 100 } });
    },
  },
  {
    label: "R",
    min: 0,
    max: 200,
    getVal: (noiseSynth) => noiseSynth.envelope.get("release").release / 100,
    onChange: (noiseSynth, val) => {
      noiseSynth.set({ envelope: { release: val / 100 } });
    },
  },
];

const EFFECT_SLIDERS = [
  {
    label: "Color",
    min: 0,
    max: 100,
    getVal: () => cheby.wet.value * 100,
    onChange: (val) => (cheby.wet.value = val / 100),
  },
  {
    label: "LP Cutoff",
    min: 32,
    max: 128,
    getVal: () => lpFilter.frequency.value,
    onChange: (val) => (lpFilter.frequency.value = Math.pow(2, val / 8)),
  },
  {
    label: "HP Cutoff",
    min: 32,
    max: 128,
    getVal: () => hpFilter.frequency.value,
    onChange: (val) => (hpFilter.frequency.value = Math.pow(2, val / 8)),
  },
  {
    label: "Volume",
    min: 0,
    max: 100,
    getVal: () => destinationGain * 100,
    onChange: (val) => {
      DESTINATION_OUTPUT.gain.value = val / 100;
    },
  },
];

const ACTIVE_EFFECTS = [cheby, hpFilter, lpFilter];
const DESTINATION_OUTPUT = new Tone.Gain(destinationGain).fan(
  Tone.Destination,
  fft
);
const FX_BUS = new Tone.Gain().chain(...ACTIVE_EFFECTS, DESTINATION_OUTPUT);

const getSlider = ({ min, max, getVal, label, onChange }) => {
  const wrapper = $(`<div class="slider-wrapper" />`);
  const slider = $(
    `<input type="range" min=${min} max=${max} value="${getVal()}"/>`
  );
  slider.on("input", () => onChange(parseInt(slider.val())));
  wrapper.append(slider);
  wrapper.append(`<label>${label}</label>`);
  return wrapper;
};

const getDropdown = ({ label, options, getVal, onChange }) => {
  const wrapper = $(`<div class="select-wrapper" />`);
  wrapper.append(`<label>${label}</label>`);

  const select = $(`<select />`);
  select.on("change", () => onChange(select.val()));
  options.forEach((option) =>
    select.append(
      `<option ${
        getVal() === option ? "selected" : undefined
      }>${option}</option>`
    )
  );
  wrapper.append(select);
  return wrapper;
};

const getChord = (i) => [
  scale.get(i).fq(),
  scale.get(i + 2).fq(),
  scale.get(i + 4).fq(),
  scale.get(i + 6).fq(),
];

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
    const polySynth = new Tone.PolySynth({ maxPolyphony: 8 }); // TODO default options?
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
    // polySynth.volume.value = 0 - i * 2;
    // polySynth.connect(this.output);
    omniOsc.chain(env);

    const loop = new Tone.Loop((time) => {
      env.triggerRelease();
      env.triggerAttack(time);
    });

    const isLooping = true;

    return { harmonic: i + 1, polySynth, omniOsc, env, loop, isLooping };
  });

  // connect first to output
  this.synths[0].env.connect(this.output);

  // connect rest to previous one
  for (let i = 1; i < this.synths.length; i++) {
    this.synths[i].env.connect(this.synths[0].env);
  }

  this.noiseSynthController.noiseSynth.connect(this.synths[0].env);

  const getOscs = () => this.synths;

  this.synths.forEach((synth, i) => {
    const oscDiv = $(`<div class="osc osc--${i}" />`);
    oscDiv.append(`<div><h3>Osc ${i + 1}</h3></div>`);
    oscDiv.css({
      backgroundColor: `hsl(${(i / NUM_OSCS) * 40 - 10}, 50%, 50%)`,
    });

    SYNTH_DROPDOWNS.forEach(({ label, options, getVal, onChange }) => {
      const select = getDropdown({
        label,
        options,
        getVal: () => getVal(synth),
        onChange: (val) => onChange(synth, val),
      });
      oscDiv.append(select);
    });

    SYNTH_SLIDERS.forEach(({ label, min, max, getVal, onChange }) => {
      const slider = getSlider({
        label,
        min,
        max,
        getVal: () => getVal(synth),
        onChange: (val) => onChange(synth, val),
      });
      oscDiv.append(slider);
    });

    $("#controls").append(oscDiv);
  });

  // Add noise div -- TODO refactor
  const noiseDiv = $(`<div class="osc" />`);
  noiseDiv.append(`<div><h3>Noise</h3></div>`);
  noiseDiv.css({ backgroundColor: `hsl(200, 50%, 50%)` });

  NOISE_DROPDOWNS.forEach(({ label, options, getVal, onChange }) => {
    const select = getDropdown({
      label,
      options,
      getVal: () => getVal(this.noiseSynthController),
      onChange: (val) => onChange(this.noiseSynthController, val),
    });
    noiseDiv.append(select);
  });

  NOISE_SLIDERS.forEach(({ label, min, max, getVal, onChange }) => {
    const slider = getSlider({
      label,
      min,
      max,
      getVal: () => getVal(noiseSynth),
      onChange: (val) => onChange(noiseSynth, val),
    });
    noiseDiv.append(slider);
  });
  $("#controls").append(noiseDiv);

  return {
    triggerAttack: (note, time) => {
      if (this.noiseSynthController.isLooping) {
        this.noiseSynthController.loop.cancel();
        this.noiseSynthController.loop.start();
      } else {
        this.noiseSynthController.loop.cancel();
        // this.noiseSynthController.noiseSynth.triggerRelease(time);
        this.noiseSynthController.noiseSynth.triggerAttack(time);
      }

      getOscs().forEach(({ polySynth, omniOsc, env, harmonic, loop }, i) => {
        // polySynth.triggerAttackRelease(
        //   note * (harmonic === 0 ? 0.5 : harmonic),
        //   dur,
        //   time
        // );

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
          // env.triggerRelease(time + dur); // todo look into this
        }
      });
    },
    triggerRelease: (time) => {
      getOscs().forEach(({ polySynth, omniOsc, env }, i) => {
        polySynth.releaseAll(time);
        env.triggerRelease(time);
        console.log("stop time", time);
        omniOsc.stop(time + env.release.value);
      });
      this.noiseSynthController.noiseSynth.triggerRelease();
    },
  };
}

/* ============== main loop ================  */

Tone.Transport.scheduleRepeat((time) => {
  console.log("schedule time", time);
  const chord = getChord(chordIndex);
  synth.triggerAttack(chord[chordNoteIndex] * octaveMultiplier, time);
  // chordNoteIndex++;
  // chordNoteIndex = chordNoteIndex % chord.length;

  // synth1.triggerAttackRelease(
  //   chord[chordNoteIndex] * octaveMultiplier,
  //   0.1,
  //   time
  // );
  // chordNoteIndex++;
  // chordNoteIndex = chordNoteIndex % chord.length;

  // synth2.triggerAttackRelease(
  //   chord[chordNoteIndex] * octaveMultiplier,
  //   0.1,
  //   time
  // );
  chordNoteIndex++;
  chordNoteIndex = chordNoteIndex % chord.length;
}, "1n");

function toggleTransport() {
  Tone.Transport.toggle();
  if (Tone.Transport.state === "stopped") {
    synth.triggerRelease();
  }
}

function setup() {
  createCanvas(800, 500);
  pixelDensity(0.1);
  background(200);
  Tone.Transport.bpm.value = 50;

  const effectsDiv = $(`<div class="osc fx" />`);
  effectsDiv.append(`<div><h3>Output</h3></div>`);

  synth = new Synth();
  // synth1 = new Synth();
  // synth2 = new Synth();

  EFFECT_SLIDERS.forEach(({ label, min, max, getVal, onChange }) => {
    const slider = getSlider({ label, min, max, getVal, onChange });
    effectsDiv.append(slider);
  });
  $("#controls").append(effectsDiv);
}

function draw() {
  background(200, 100);
  noStroke();
  // const t = frameCount / 8000;
  const graph = fft.getValue();
  const sum = { r: 1, g: 1, b: 1 };
  graph.forEach((value, i) => {
    const fq = fft.getFrequencyOfIndex(i);
    const hue = (fq / 24000) * 360;
    const hueInt = parseInt(hue);
    const [r, g, b] = HSLToRGB(hueInt, 100, 50);
    // console.log(r, g, b);
    const absV = Math.abs(value);
    sum.r += value < -130 ? 0 : (r * absV) / 185;
    sum.g += value < -130 ? 0 : (g * absV) / 185;
    sum.b += value < -130 ? 0 : (b * absV) / 185;
    // const c = color(`hsl(${parseInt(hueInt)}, 50%, 50%)`);
    // fill(c);
    // console.log(log(fq));
    // rect(i, height, 1, -1 * (height - (absV / 185) * height));
  });
  // console.log(sum);
  const max = Math.max(sum.r, sum.g, sum.b);
  // console.log(sum);

  fill(
    (sum.r / 90000) * 255,
    (sum.g / 90000) * 255,
    (sum.b / 90000) * 255,
    200
  );

  rect(0, 0, width, height);
}

function keyPressed() {
  // Change octave
  if (key === "z") {
    octaveMultiplier = Math.max(octaveMultiplier / 2, 0.25);
  }
  if (key === "x") {
    octaveMultiplier = Math.min(octaveMultiplier * 2, 4);
  }
  if (key === "a") {
    octaveMultiplier = Math.min(octaveMultiplier * 2, 4);
  }

  // play/pause
  if (key === " ") {
    toggleTransport();
  }
}

// Change chord on mouse move
function mouseMoved() {
  const x = parseInt((mouseX / width) * scale.notes().length - 1);
  chordIndex = x + 1;
}

// Change BPM on scroll
function mouseWheel({ delta }) {
  let bpm = Tone.Transport.bpm.value;
  if (delta > 0) {
    bpm += parseInt(Math.min(delta / 4, 20));
  } else {
    bpm += parseInt(Math.max(delta / 4, -20));
  }
  if (bpm > 200) {
    bpm = 200;
  }
  if (bpm < 20) {
    bpm = 20;
  }
  Tone.Transport.bpm.value = bpm;
}
