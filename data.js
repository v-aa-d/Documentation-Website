/*
  Single source of truth for every experiment shown in the index list.
  - "path" is relative to the experiment's own section folder and points at
    the real, already-existing sketch (or, for gallery-type entries, is unused).
  - "keyword" and "type" (digital/analogue) are auto-guessed placeholders —
    edit them here, they are not derivable from the filesystem.
  - "date" is taken from each sketch's own file mtime (not folder mtime,
    which was reset when the folders were copied).
*/

const ABOUT_TEXT = `Vessels for Translation is motivated by the curiosity to approach a design project differently, taking inspiration from unexpected sources and translating them into visual outputs; deliberately choosing content that challenges my own design practice as much as it challenges the reader. Translation, in this context, is understood not as an exact equivalence but as a transformation: meaning that an original source is never fully equivalent once translated, something is changed. If the traditional way of translating is to transfer meaning from language to language, I intend to transfer meaning into visual content that conveys language.

In what ways can generative tools be used to translate scientific terms into typography? The content chosen to be translated are scientific terms relating to artificial intelligence and physics (latent space, superposition, entropy), terms that are challenging and less accessible due to their complexity. Looking back on the three concepts explored, taking translation as transformation method became a new way for me to engage with design and to challenge myself. By taking the role of an interpreter, I was able to approach each concept on its own terms, using letterforms as a vessel for theories that would otherwise stay abstract. Working across analogue experiments, before moving into digital environments, showed that no single tool is enough on its own. This project highlights how typography opens a space where design and science can meet on equal terms.

This is the documentation of the experiments done during the thesis process in the last semester of the Master in Digital Communication Enviroments in HGK Basel, Switzerland.
 
© 2026 Veronica Arancibia Daes. All rights reserved.`;

const EXPERIMENTS = [
  // superposition
  {
    term: "x-height sine grid + pause",
    keyword: "grid",
    type: "digital",
    date: "09.06.26",
    section: "superposition",
    mode: "iframe",
    path: "quantic grid - pause/index.html",
images: [
      "quantic grid - pause/1.png",
      "quantic grid - pause/2.png",
      "quantic grid - pause/3.png",
      "quantic grid - pause/4.png",
      "quantic grid - pause/5.png",
      "quantic grid - pause/6.png",
      "quantic grid - pause/7.png",
      "quantic grid - pause/8.png",
      "quantic grid - pause/9.png",
      "quantic grid - pause/10.png",
    ],

    description:
      "I wanted to include the option of writing words, and even complete sentences, where the x-height was adjusted according to the number of lines written. When there was only one line, the letters were stretched out, but when there were two, three or four lines, their height adjusted accordingly to fit into the space in the browser window.",
  },
  {
    term: "sine grid + scrolling text",
    keyword: "grid",
    type: "digital",
    date: "06.06.26",
    section: "superposition",
    mode: "iframe",
    path: "quantic grid - scrolling text, different sine waves/index.html",
    description:
      "In order to display more than one letter at a time, i tried to display them in a scrolling motion, from right to left. While each letter typed was mapped into the grid, the line of text would move across the screen. Different types of sine wave were added to the grid, showing a diverse range in the motion of the structure.",
  },
  {
    term: "split screen typing - grid",
    keyword: "grid",
    type: "digital",
    date: "25.05.26",
    section: "superposition",
    mode: "iframe",
    path: "irregular grid letter/index.html",
    description:
      "This is an iteration of the last version, removing the grid behind each version of the letters typed in the right side of the screen.",
  },
  {
    term: "quantum grid + typing",
    keyword: "typing",
    type: "digital",
    date: "07.05.26",
    section: "superposition",
    mode: "iframe",
    path: "irregular grid letter typing letters/index.html",
     images: [
      "irregular grid letter typing letters/1.png",
      "irregular grid letter typing letters/2.png",
      "irregular grid letter typing letters/3.png",
      "irregular grid letter typing letters/4.png",
      "irregular grid letter typing letters/5.png",
      "irregular grid letter typing letters/6.png",
      "irregular grid letter typing letters/7.png",
      "irregular grid letter typing letters/8.png",
      "irregular grid letter typing letters/9.png",
      "irregular grid letter typing letters/10.png",
    ],
    description:
      "Every time a letter is typed on the keyboard, the grid collapses by filling units to create the shape of that same letter, conserving the state of each individual cell. As the same letter is pressed several times, the change of the state in the grid is viusally variable.",
  },
  {
    term: "quantum grid + letter collapse",
    keyword: "grid",
    type: "digital",
    date: "03.05.26",
    section: "superposition",
    mode: "iframe",
    path: "irregular grid letter-responsivecells/index.html",
    images: [
      "irregular grid letter-responsivecells/1.png",
      "irregular grid letter-responsivecells/2.png",
      "irregular grid letter-responsivecells/3.png",
      "irregular grid letter-responsivecells/4.png",
      "irregular grid letter-responsivecells/5.png",
      "irregular grid letter-responsivecells/6.png",
      "irregular grid letter-responsivecells/7.png",
      "irregular grid letter-responsivecells/8.png",
      "irregular grid letter-responsivecells/9.png",
      "irregular grid letter-responsivecells/10.png",
      "irregular grid letter-responsivecells/11.png", 
      "irregular grid letter-responsivecells/12.png", 
      "irregular grid letter-responsivecells/13.png",
      "irregular grid letter-responsivecells/14.png",
      "irregular grid letter-responsivecells/15.png",
      "irregular grid letter-responsivecells/16.png",
      "irregular grid letter-responsivecells/17.png",
      "irregular grid letter-responsivecells/18.png",
      "irregular grid letter-responsivecells/19.png",
      "irregular grid letter-responsivecells/20.png",
      "irregular grid letter-responsivecells/21.png",
      "irregular grid letter-responsivecells/22.png",
      "irregular grid letter-responsivecells/23.png",
      "irregular grid letter-responsivecells/24.png",
      "irregular grid letter-responsivecells/25.png",
      "irregular grid letter-responsivecells/26.png",

    ],
    description:
      "With a binary grid as a base, each cell continues to shift and rotate. The next step was to define which cells should be filled and which empty using the binary principle to be able to get a recognisable letter. The moment I pressed the space bar, the structure would collapse and hold the state where it was paused and show a letter, shaped by the different stated of the units in the grid. Instead of using a circle to build the grid, I used squares.",
  },
  // {
  //   term: "irregular grid quantum",
  //   keyword: "quantum",
  //   type: "digital",
  //   date: "25.04.26",
  //   section: "superposition",
  //   mode: "iframe",
  //   path: "irregular grid quantum/index.html",
  //   description:
  //     "Grid cells rendered as if holding two letterforms at once, only settling into one when the animation comes to rest.",
  // },
  {
    term: "letter layer superposition",
    keyword: "quantum",
    type: "digital",
    date: "15.06.26",
    section: "superposition",
    mode: "gallery",
    images: Array.from(
      { length: 17 },
      (_, i) => `letter layer superposition/${i + 1}${i === 0 ? ".gif" : ".png"}`
    ),
    description:
      "Exporting each letter as an image, to then superpose all the variations on top of eachother. The result is a letterform that holds all the possible states of the ever-changing grid.",
  },
  {
    term: "word layer superposition",
    keyword: "quantum",
    type: "digital",
    date: "15.06.26",
    section: "superposition",
    mode: "gallery",
    images: Array.from(
      { length: 5 },
      (_, i) => `word layer superposition/${i + 1}${i === 0 ? ".gif" : ".png"}`
    ),
    description:
      "Appliying the same logic as the previous example, but this time on a word.",
  },
  {
    term: "binary grid + rotation",
    keyword: "rotation",
    type: "digital",
    date: "01.05.26",
    section: "superposition",
    mode: "iframe",
    path: "irregular grid rotation/index.html",
    images: [
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.00.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.02.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.05.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.09.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.12.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.16.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.22.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.28.png",
      "irregular grid quantum/Screenshot 2026-05-03 at 18.09.42.png",
      "irregular grid quantum/Screenshot 2026-05-04 at 14.53.24.png",
    ],
    description:
      "Superposition can be compared to flipping a coin: if it were in a state of quantum superposition, the coin would exist in both possible states, heads and tails. Considering this I began to experiment what would happen if each unit of the grid started to spin like a coin, one side is filled, and the other empty. ",
  },
  {
    term: "split screen typing + grid",
    keyword: "typing",
    type: "digital",
    date: "15.05.26",
    section: "superposition",
    mode: "iframe",
    path: "irregular grid typing letters/index.html",
    description:
      "I began to add the option to type directly, so that every time a letter was pressed, the structure would collapse and stop at the moment the key was hit. Therefore, if the same letter were pressed two or more times, the quantum structure would cause each letter to be different from one another; while a close up of the letter is shown in the left side of the screen, the characters exist in a context in the right side.",
  },
  {
    term: "binary grid",
    keyword: "grid",
    type: "digital",
    date: "20.04.26",
    section: "superposition",
    mode: "iframe",
    path: "irregular grid 1/index.html",
    description:
      "Before a particle can exist in multiple states at the same time, I had to define in which states it could be in. The binary principle refers to a numbering system that uses 1s and 0s to represent physical electrical states, such as on and off. I started by having a 5x8 pixel grid, composed by overlapping circles, where they could be either filled or empty ",
  },
  {
    term: "sine grid single letter",
    keyword: "movement",
    type: "digital",
    date: "05.06.26",
    section: "superposition",
    mode: "iframe",
    path: "single letter movement/index.html",
    description:
      "what if there was a grid where letters are formed, and moves according to a mathematical formula? I began looking for algorithms that describe movement, and the most common ones are sine waves: a periodic oscillation that plots the mathematical sine function. building the grid to then map a letterform on it, where the shape of it would be manipulated by the strech and collapse of the structure.",
  },

  // latent
  {
    term: "unbound sequence",
    keyword: "sequence",
    type: "analogue",
    date: "16.03.26",
    section: "latent",
    mode: "gallery",
    images: Array.from({ length: 18 }, (_, i) => `booklet/a-.${24 + i}.png`),
    description:
      "An unbound book that holds all the possible combinations between two halves of an capital A, trying to represent latent space in an analogue way. The letters were printed on semi-transparent paper, making one side remain hidden and completing the shape with the next page.",
  },
  {
    term: "animalarium",
    keyword: "sequence",
    type: "analogue",
    date: "18.03.26",
    section: "latent",
    mode: "gallery",
    images: Array.from({ length: 6 }, (_, i) => `animalarium/a-.${2 + i}.png`),
    description:
      "Inspired by Professor Revillod's Animalarium, a lowercase a is split into four sections, creating a different version of the letterform every time the page is turned on any section.The base was done with a mono-line lowercase ‘a’, stretched to fit the long format, each page had a different stroke style, where sometimes the values were taken to extremes, creating textures along the lines.",
  },
  {
    term: "plotter latency",
    keyword: "sequence",
    type: "analogue",
    date: "20.03.26",
    section: "latent",
    mode: "gallery",
    images: Array.from({ length: 8 }, (_, i) => `penplotter/1.${i + 1}.png`),
    description:
      "‘Latency’ is the in-between time before a machine performs a request. Based on the SVG files sent to the machine, the pen plotter transfers them onto a surface with a pen. The way in which I was going to interact with the machine’s latency was to move the paper at the same time as the pen plotter’s arm was moving to draw the letters I sent",
  },
  {
    term: "xy axis shear",
    keyword: "sequence",
    type: "analogue",
    date: "22.03.26",
    section: "latent",
    mode: "gallery",
    images: Array.from(
      { length: 9 },
      (_, i) => `p5.js sheer/${i + 1}${i < 3 ? ".gif" : ".png"}`
    ),
    description: "My aim was to create a digital space where I could navigate through all the states in an interpolation process, stopping in the weird in-between spots that could show up. I took ‘latent space’ as a zone that holds coordinates with multiple possible answers, and the act of navigating through those possibilities in a visual way. I started with a sketch in p5.js, placing letters on the screen, and added a layer that would interact with the letters: the shear() function, which, depending on how I moved my cursor, would distort the letters along the X and Y axes. Every time the cursor moves, the shapes shift and overlap with each other. "
  },
  {
    term: "python interpolation",
    keyword: "sequence",
    type: "analogue",
    date: "06.05.26",
    section: "latent",
    mode: "gallery",
    images: [
      "AI interpolation/interpolation.mp4",
      "AI interpolation/interpolation2.mp4",
      "AI interpolation/range.mp4",
      "AI interpolation/range.png",
      "AI interpolation/dcdcd.png",
      "AI interpolation/lll.png",
      "AI interpolation/www.png",
    ],
    description: "To explore how interpolation can look like with other tools, I tried python to feed letterforms into a neural network and navigate through the different steps. It would start training the interface by feeding some images done with the quantum grid, to then estimate the missing inbetween points. This particular experiment did not work as expected, I didnt have any control over what was generated, therefore I didn't continue developing it."
  },
  {
    term: "letter interpolation",
    keyword: "morph",
    type: "digital",
    date: "02.04.26",
    section: "latent",
    mode: "iframe",
    path: "letter morphing final/index.html",
    images: [
      "letter morphing final/1.png",
      "letter morphing final/2.mp4",
      "letter morphing final/3.png",
      "letter morphing final/4.mp4",
      "letter morphing final/5.mp4",
      "letter morphing final/6.mp4",
      "letter morphing final/7.mp4",
      "letter morphing final/8.mp4",
     
    ],
    description:
      "I began to build a tool that lets me navigate through every step of the interpolation between different letters, from a to b to c using the same amount of dots to build each character. Introducing also different types of interpolation, size of the points and speed of the animation. I had to apply it to the simplest letterform possible at first, ideally a mono-line structure. This is why I chose to work with Hershey Fonts; a collection of vector fonts developed in 1967 by Dr. Allen Vincent Hershey.",
  },

  {
    term: "word inter/extrapolation UI",
    keyword: "morph",
    type: "digital",
    date: "07.07.26",
    section: "latent",
    mode: "iframe",
    path: "extrapolation-type-words-light-ui/index.html",
    description:
      "Reducing the interface and the colors as a more simple approach to the previous experiment. ",
  },
  {
    term: "letter navigation",
    keyword: "navigation",
    type: "digital",
    date: "07.04.26",
    section: "latent",
    mode: "iframe",
    path: "letter navigation/index.html",
    images: [
      "letter navigation/letter-morph (40).png",
      "letter navigation/letter-morph (41).png",
      "letter navigation/letter-morph (42).png",
      "letter navigation/letter-morph (43).png",
      "letter navigation/letter-morph (44).png",
      "letter navigation/letter-morph (45).png",
      "letter navigation/letter-morph (46).png",
      "letter navigation/letter-morph (47).png",
      "letter navigation/letter-morph (48).png",
      "letter navigation/letter-morph (49).png",
      "letter navigation/letter-morph (50).png",
      "letter navigation/letter-morph (51).png",
      "letter navigation/letter-morph (52).png",
      "letter navigation/letter-morph (53).png",
      "letter navigation/letter-morph (54).png",
      "letter navigation/letter-morph (55).png",
      "letter navigation/letter-morph (56).png",
      "letter navigation/letter-morph (57).png",
      "letter navigation/letter-morph (58).png",
      "letter navigation/letter-morph (59).png",
      "letter navigation/letter-morph (60).png",
      "letter navigation/letter-morph (61).png",
      "letter navigation/letter-morph (64).png",
      "letter navigation/letter-morph (65).png",
      "letter navigation/letter-morph (66).png",
      "letter navigation/letter-morph (67).png",
      "letter navigation/letter-morph (68).png",
      "letter navigation/letter-morph (69).png",
      "letter navigation/letter-morph (70).png",
      "letter navigation/letter-morph (71).png",
      "letter navigation/letter-morph (72).png",
      "letter navigation/letter-morph (73).png",
      "letter navigation/letter-morph (74).png",
      "letter navigation/letter-morph (75).png",
      "letter navigation/letter-morph (76).png",
      "letter navigation/letter-morph (77).png",
      "letter navigation/letter-morph (78).png",
      "letter navigation/letter-morph (79).png",
      "letter navigation/letter-morph (80).png",
      "letter navigation/letter-morph (81).png",
      "letter navigation/letter-morph (82).png",
      "letter navigation/letter-morph (83).png",
      "letter navigation/letter-morph (84).png",
      "letter navigation/letter-morph (85).png",
      "letter navigation/letter-morph (86).png",
      "letter navigation/letter-morph (87).png",
      "letter navigation/letter-morph (88).png",
      "letter navigation/letter-morph (89).png",
      "letter navigation/letter-morph (90).png",
      "letter navigation/letter-morph (91).png",
    ],
    description:
      "What would happen if I introduced another axis into this navigation? In other words, instead of having just one horizontal X-axis, what if I also included a Y-axis where navigation could take place in all directions? As latent spaces are built on a high dimensional structure that doesn’t have predefined axes, it’s interesting to think about including more than one and being able to navigate in different directions.",
  },
  {
    term: "letter extrapolation",
    keyword: "extrapolation",
    type: "digital",
    date: "16.04.26",
    section: "latent",
    mode: "iframe",
    path: "extrapolation-type/index.html",
    images: ["extrapolation-type/1.png", "extrapolation-type/2.png", "extrapolation-type/3.png", "extrapolation-type/4.png", "extrapolation-type/5.png", "extrapolation-type/6.png", "extrapolation-type/7.png", "extrapolation-type/8.png", "extrapolation-type/9.png"],
    description:
      "Adding the possibility to extrapolate between letters, reaching to stages that only intrapolation would not allow. Also, another parameters were added to the system, being number of strokes and the gap between them. By combining these variables more complex compositions can be achieved.",
  },
  {
    term: "word inter/extrapolation",
    keyword: "extrapolation",
    type: "digital",
    date: "03.05.26",
    section: "latent",
    mode: "iframe",
    path: "extrapolation-type-words/index.html",
    images: ["extrapolation-type-words/1.png", "extrapolation-type-words/2.png", "extrapolation-type-words/3.png", "extrapolation-type-words/4.png", "extrapolation-type-words/5.png", "extrapolation-type-words/6.png", "extrapolation-type-words/7.png", "extrapolation-type-words/8.png", "extrapolation-type-words/9.png", "extrapolation-type-words/10.png"],
    description:
      "Another layer of variability was added to the composition, allowing to use whole words to navigate through the latent space, following the same principles as the letters. The parameter of the shapes fo each point was also added, letting the shapes that follow the coordinates become a circle, squeare, diamond or triangle, toggling between fill and stroke.",
  },
  {
    term: "3D coordinates translation",
    keyword: "sequence",
    type: "analogue",
    date: "10.07.26",
    section: "latent",
    mode: "gallery",
    images: ["3d-plot/1.png", "3d-plot/2.png", "3d-plot/3.png", "3d-plot/4.mp4", "3d-plot/5.png", "3d-plot/6.png", "3d-plot/7.png", "3d-plot/8.png", "3d-plot/9.png"],
    description:
      "The web enviroment provides a base to explore the translation into a physical space. The SVG files can be reinterpreted into a G-Code that is sent to a 3D printer, following the same coordinates but this time with a material.",
  },

  {
    term: "analogue animation",
    keyword: "sequence",
    type: "analogue",
    date: "08.07.26",
    section: "latent",
    mode: "gallery",
    images: ["analogue animation/1.gif", "analogue animation/2.gif", "analogue animation/3.gif", "analogue animation/4.gif", ],
    description:
      "The web enviroment provides a base to explore the translation into a physical space. The SVG files can be reinterpreted into a G-Code that is sent to a 3D printer, following the same coordinates but this time with a material.",
  },
  // entropy
  {
    term: "letters as containers",
    keyword: "particles",
    type: "digital",
    date: "03.06.26",
    section: "entropy",
    mode: "iframe",
    path: "container letters/index.html",
    images: ["container letters/1.png", "container letters/2.png", "container letters/3.png"],
    description:
      "To get closer to translating this concept, I relied on the idea of particles filling a container, where, as entropy levels rise, the particles fill more space, making the vessel reach a more organic shape. For this trial, I considered two different parameters: the size of particles present and the level of disorder, bearing in mind, both could be manipulated and combined to explore various states of entropy.",
  },
  {
    term: "added stroke",
    keyword: "stroke",
    type: "digital",
    date: "03.06.26",
    section: "entropy",
    mode: "iframe",
    path: "entropy type-fill and stroke/index.html",
    images: ["entropy type-fill and stroke/1.png", "entropy type-fill and stroke/2.png", "entropy type-fill and stroke/3.png","entropy type-fill and stroke/4.png"],
    description:
      "The readability range was being tested by the size of the particles, where it reached a point where the containers began to grow and dissolve. Another layer of shape language, surrounding each character, almost containing the particles inside.",
  },
  {
    term: "cellular automata movement",
    keyword: "movement",
    type: "digital",
    date: "04.07.26",
    section: "entropy",
    mode: "iframe",
    path: "container letters movement/index.html",
    images: ["container letters movement/1.png", "container letters movement/2.png", "container letters movement/3.png"],
    description:
      "Testing different types of movement, in this case, a motion guided by the cellular automata system. It consists of a regular grid of cells, that have finite number of states, dead and alive, and according to that each particle moves or stays still. The motion is controlled by the entropy variable, moving the particles more or less depending on the value of the slider.",
  },
  {
    term: "spline movement",
    keyword: "movement",
    type: "digital",
    date: "08.07.26",
    section: "entropy",
    mode: "iframe",
    path: "Letter container dot matrix spline/index.html",
     images: ["Letter container dot matrix spline/1.png", "Letter container dot matrix spline/2.png", "Letter container dot matrix spline/3.png", "Letter container dot matrix spline/4.mp4","Letter container dot matrix spline/5.png"],
    description:
      "Trying other types of motion on the particles, this time structuring a dot matrix over each font, to then apply a spline mathematical function that interpolates the movement and smoothens the surface. By augmenting the entropy level, the movement is amplified.",
  },
  {
    term: "3D paper plot",
    keyword: "movement",
    type: "digital",
    date: "08.07.26",
    section: "entropy",
    mode: "gallery",
    path: "3d plot/index.html",
    images: ["3d plot/1.png", "3d plot/2.png", "3d plot/3.png", "3d plot/4.mp4","3d plot/5.png", "3d plot/6.png", "3d plot/8.png"],
    description:
      "The different levels of entropy also generate SVG files that can be repurposed by feeding them into a 3D printer. Although these files require a surface such as paper, printing still works, as they consist of vectors that intersect to form a letterform.",
  },
]
  .sort((a, b) => monthDayKey(a.date) - monthDayKey(b.date))
  .map((entry, i) => ({ number: String(i + 1).padStart(2, "0"), ...entry }));

// Sorts by calendar month then day, ignoring year — e.g. 03.16 comes before 04.02.
// Dates are stored as "DD.MM.YY".
function monthDayKey(dateStr) {
  const [, day, month] = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(dateStr);
  return Number(month) * 100 + Number(day);
}

const SECTIONS = [
  {
    slug: "latent",
    label: "Latent Space",
    blurb:
      "A term derived from machine-learning, it refers to the abstract high-dimensional space where data is compressed and arranged, this process happens every time the machine-learning model analyses a dataset. Latent spaces are, in a way, similar to a map; they contain coordinates that result from compression and dimensionality reduction. Even though they can be considered as maps, no human eye can explore them in their entirety, due to their invisible nature and extension.\n\nInterpolation, Coordinates, Navigation.",
  },
  {
    slug: "superposition",
    label: "Quantum Superposition",
    blurb: "Superposition is a foundational concept in quantum mechanics; it describes the condition in which a quantum system makes possible for a particle to exist in multiple states simultaneously. This can be seen as an example in computing, where a classic bit of information can be labelled in two possible states, as ‘1’ and ‘0’. But, in quantum systems, it can become a qubit that exists in both states at the same time, or in any state that is a combination of both.\n\nCollapse, Binary states, Multiplicity.",
  },
  {
    slug: "entropy",
    label: "Thermodynamic Entropy",
    blurb: "This phenomenon is part of the second law of thermodynamics, a measure of the unavailable energy in a closed system, usually considered to be a measure of the system’s disorder or a degree of uncertainty. The term is derived from the Greek word, tropē, that can be translated as turn-ing or change, describing the energy exchange in a thermodynamic system. This mostly applies to the distribution of particles across a space, where, ac-cording to the level of entropy, are arranged in a rigid structure or roam freely through the same area.\n\nEnergy exchange, Particles, Container.",
  },
];
