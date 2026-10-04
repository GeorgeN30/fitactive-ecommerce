const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/OnboardingModal.tsx', 'utf8');
c = c.replace('const [cadera, setCadera] = useState(90);', 'const [cadera, setCadera] = useState(90);\n  const [muslo, setMuslo] = useState(55);');
c = c.replace('medida_cadera: cadera,', 'medida_cadera: cadera,\n          medida_muslo: muslo,');
c = c.replace('{l: "Cadera", v: cadera, s: setCadera}', '{l: "Cadera", v: cadera, s: setCadera}, {l: "Muslo", v: muslo, s: setMuslo}');
fs.writeFileSync('frontend/src/components/OnboardingModal.tsx', c);
