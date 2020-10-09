Tone.context.latencyHint = "playback";

let chordIndex = 0;
let octaveMultiplier = 1;
let chordNoteIndex = 0;
let destinationGain = 0.3;
let voiceIndex = 0;

const NUM_OSCS = 4;

/* ================= Create effects chain ================= */

const fft = new Tone.FFT();

const autoFilter = new Tone.AutoFilter(1).start();
const scale = teoria.note("a").scale("major");
const hpFilter = new Tone.Filter({ frequency: 5, type: "highpass" });
const lpFilter = new Tone.Filter(20000, "lowpass");
const cheby = new Tone.Chebyshev({ order: 2, wet: 0 });

const ACTIVE_EFFECTS = [cheby, hpFilter, lpFilter];
const DESTINATION_OUTPUT = new Tone.Gain(destinationGain).fan(
  Tone.Destination,
  fft
);
const FX_BUS = new Tone.Gain().chain(...ACTIVE_EFFECTS, DESTINATION_OUTPUT);

/* ================= Create three synth voices ================= */

const synth = new Synth();
const synth1 = new Synth();
const synth2 = new Synth();
const voices = [synth, synth1, synth2];

/* ================= Set up dynamic parameters ================= */

// Only look at the first voice for initializing sliders
const initialOscs = voices[0].getOscs();
const noiseSynthController = voices[0].getNoiseSynthController();

const SYNTH_DROPDOWNS = [
  {
    label: "Type",
    options: ["sine", "triangle", "square", "sawtooth"],
    getVal: (oscIndex) => initialOscs[oscIndex].omniOsc.get("type").type,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setOscType(oscIndex, val);
      });
    },
  },
  {
    label: "Loop",
    options: ["off", "16n", "16t", "32n"],
    getVal: (oscIndex) => "off",
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setLoop(oscIndex, val);
      });
    },
  },
];

const SYNTH_SLIDERS = [
  {
    label: "Base",
    min: 0,
    max: 10,
    getVal: (oscIndex) => initialOscs[oscIndex].harmonic,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setHarmonic(oscIndex, val);
      });
    },
  },
  {
    label: "Volume",
    min: -24,
    max: 0,
    getVal: (oscIndex) => {
      const vol = initialOscs[oscIndex].omniOsc.volume.value;
      return vol === -Infinity ? -24 : vol;
    },
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setVolume(oscIndex, val);
      });
    },
  },
  {
    label: "Detune",
    min: -20,
    max: 20,
    getVal: (oscIndex) => initialOscs[oscIndex].omniOsc.detune.value,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setDetune(oscIndex, val);
      });
    },
  },
  {
    label: "A",
    min: 1,
    max: 200,
    getVal: (oscIndex) => initialOscs[oscIndex].env.attack * 100,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setEnvValue(oscIndex, "attack", val / 100);
      });
    },
  },
  {
    label: "D",
    min: 1,
    max: 200,
    getVal: (oscIndex) => initialOscs[oscIndex].env.decay * 100,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setEnvValue(oscIndex, "decay", val / 100);
      });
    },
  },
  {
    label: "S",
    min: 1,
    max: 100,
    getVal: (oscIndex) => initialOscs[oscIndex].env.sustain * 100,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setEnvValue(oscIndex, "sustain", val / 100);
      });
    },
  },
  {
    label: "R",
    min: 0,
    max: 200,
    getVal: (oscIndex) => initialOscs[oscIndex].env.release * 100,
    onChange: (oscIndex, val) => {
      voices.forEach((synth) => {
        synth.setEnvValue(oscIndex, "release", val / 100);
      });
    },
  },
];

const NOISE_SLIDERS = [
  {
    label: "Volume",
    min: -24,
    max: 0,
    getVal: () => {
      const vol = noiseSynthController.noiseSynth.volume.value;
      return vol === -Infinity ? -24 : vol;
    },
    onChange: (val) => {
      voices.forEach((synth) => {
        synth.setNoiseVolume(val === -24 ? -Infinity : val);
      });
    },
  },
  {
    label: "A",
    min: 1,
    max: 200,
    getVal: () =>
      noiseSynthController.noiseSynth.envelope.get("attack").attack / 100,
    onChange: (val) => {
      voices.forEach((synth) => {
        synth.setNoiseEnvValue("attack", val / 100);
      });
    },
  },
  {
    label: "D",
    min: 1,
    max: 200,
    getVal: () =>
      noiseSynthController.noiseSynth.envelope.get("decay").decay / 100,
    onChange: (val) => {
      voices.forEach((synth) => {
        synth.setNoiseEnvValue("decay", val / 100);
      });
    },
  },
  {
    label: "S",
    min: 1,
    max: 100,
    getVal: () =>
      noiseSynthController.noiseSynth.envelope.get("sustain").sustain / 100,
    onChange: (val) => {
      voices.forEach((synth) => {
        synth.setNoiseEnvValue("sustain", val / 100);
      });
    },
  },
  {
    label: "R",
    min: 0,
    max: 200,
    getVal: () =>
      noiseSynthController.noiseSynth.envelope.get("release").release / 100,
    onChange: (val) => {
      voices.forEach((synth) => {
        synth.setNoiseEnvValue("release", val / 100);
      });
    },
  },
];

const NOISE_DROPDOWNS = [
  {
    label: "Type",
    options: ["white", "pink", "brown"],
    getVal: () => noiseSynthController.noiseSynth.noise.type,
    onChange: (val) => {
      noiseSynthController.noiseSynth.noise.set({ type: val });
    },
  },
  {
    label: "Loop",
    options: ["off", "16n", "16t", "32n"],
    getVal: () => noiseSynthController.loop.get("interval") || "off",
    onChange: (val) => {
      if (val === "off") {
        noiseSynthController.isLooping = false;
      } else {
        noiseSynthController.loop.set({ interval: val });
        noiseSynthController.isLooping = true;
      }
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

/* ================= DOM helpers ================= */

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

const initSynthSliders = () => {
  for (let i = 0; i < NUM_OSCS; i++) {
    const oscDiv = $(`<div class="osc osc--${i}" />`);
    oscDiv.append(`<div><h3>Osc ${i + 1}</h3></div>`);
    oscDiv.css({
      backgroundColor: `hsl(${(i / NUM_OSCS) * 60 - 20}, 50%, 50%)`,
    });

    SYNTH_DROPDOWNS.forEach(({ label, options, getVal, onChange }) => {
      const select = getDropdown({
        label,
        options,
        getVal: () => getVal(i),
        onChange: (val) => onChange(i, val),
      });
      oscDiv.append(select);
    });

    SYNTH_SLIDERS.forEach(({ label, min, max, getVal, onChange }) => {
      const slider = getSlider({
        label,
        min,
        max,
        getVal: () => getVal(i),
        onChange: (val) => onChange(i, val),
      });
      oscDiv.append(slider);
    });

    $("#controls").append(oscDiv);
  }
};

const initNoiseController = () => {
  const noiseDiv = $(`<div class="osc" />`);
  noiseDiv.append(`<div><h3>Noise</h3></div>`);
  noiseDiv.css({ backgroundColor: `hsl(200, 50%, 50%)` });

  NOISE_DROPDOWNS.forEach((options) => {
    noiseDiv.append(getDropdown(options));
  });

  NOISE_SLIDERS.forEach((options) => {
    noiseDiv.append(getSlider(options));
  });
  $("#controls").append(noiseDiv);
};

/* ============== Music helpers ================  */

const getChord = (i) => [
  scale.get(i).fq(),
  scale.get(i + 2).fq(),
  scale.get(i + 4).fq(),
  scale.get(i + 6).fq(),
];

const playVoice = (note, time) => {
  // const voices = [synth, synth1, synth2];
  // const prevIndex = voiceIndex;
  voices[voiceIndex].triggerRelease(note, time);
  voiceIndex++;
  voiceIndex = voiceIndex % voices.length;
  voices[voiceIndex].triggerAttack(note, time);
};

/* ============== main loop ================  */

Tone.Transport.scheduleRepeat((time) => {
  // console.log("schedule time", time);
  const chord = getChord(chordIndex);
  // synth.triggerAttack(chord[chordNoteIndex] * octaveMultiplier, time);
  playVoice(chord[chordNoteIndex] * octaveMultiplier, time);
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
}, "4n");

function toggleTransport() {
  Tone.Transport.toggle();
  if (Tone.Transport.state === "stopped") {
    voices.forEach((synth) => {
      synth.triggerRelease();
    });
  }
}

function setup() {
  initSynthSliders();
  initNoiseController();

  createCanvas(window.innerWidth, window.innerHeight);
  pixelDensity(0.1);
  background(200);
  Tone.Transport.bpm.value = 50;

  const effectsDiv = $(`<div class="osc fx" />`);
  effectsDiv.append(`<div><h3>Output</h3></div>`);

  EFFECT_SLIDERS.forEach(({ label, min, max, getVal, onChange }) => {
    const slider = getSlider({ label, min, max, getVal, onChange });
    effectsDiv.append(slider);
  });
  $("#controls").append(effectsDiv);
}

function draw() {
  background(200, 100);
  noStroke();
  const fftData = fft.getValue();
  const sum = { r: 1, g: 1, b: 1 };
  fftData.forEach((value, i) => {
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
    // rect(i, height, 1, -1 * (height - (absV / 185) * height));
  });
  // const max = Math.max(sum.r, sum.g, sum.b);
  const maxVal = 90000;
  fill(
    (sum.r / maxVal) * 255,
    (sum.g / maxVal) * 255,
    (sum.b / maxVal) * 255,
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
  // Tone.Transport.bpm.value = bpm;
}
