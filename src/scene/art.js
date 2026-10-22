// Scenografie vettoriali delle stanze e ritratti dei personaggi (coordinate della scena: 1536×960).
// L'unica fotografia è la villa, che compare nelle finestre e nello specchio.

export function portrait(n) {
  let bg = ['#142228', '#253033', '#203138'][n],
    face = ['#838677', '#adad94', '#8f9f9c'][n];
  return (
    '<svg class="character-art" viewBox="0 0 100 155" aria-hidden="true"><defs><radialGradient id="pf"><stop stop-color="' +
    face +
    '"/><stop offset="1" stop-color="#34494a"/></radialGradient></defs><path d="M4 154V47a46 46 0 0 1 92 0v107Z" fill="' +
    bg +
    '" stroke="#a58e5766" stroke-width="3"/><path d="M11 154q5-56 39-61q34 5 39 61" fill="#111d21"/><ellipse cx="50" cy="66" rx="24" ry="34" fill="url(#pf)"/>' +
    (n === 0
      ? '<path d="M22 54l6-22h45l8 22Z" fill="#152126"/><path d="M28 83q22 29 44 0q-4 34-22 31Q31 111 28 83" fill="#636f65"/>'
      : n === 1
        ? '<path d="M24 81Q7 22 49 24Q91 22 77 94L71 58Q53 48 33 60L29 97Z" fill="#172328"/>'
        : '<path d="M23 90Q7 20 52 23Q93 22 78 106L69 55Q48 44 31 63L27 111Z" fill="#101b20"/>') +
    '<path d="M34 65h9m13 0h9" stroke="#1c292c" stroke-width="3"/><path d="M44 87q6 3 12 0" stroke="#52635e" fill="none"/><rect x="8" y="8" width="84" height="142" fill="none" stroke="#a58e5722"/></svg>'
  );
}
function clockHands(x, y, h) {
  const a = (h * Math.PI) / 6;
  return (
    '<path d="M' +
    x +
    ' ' +
    y +
    'v-31" stroke="#20352a" stroke-width="2.5" stroke-linecap="round"/><path d="M' +
    x +
    ' ' +
    y +
    'l' +
    (21 * Math.sin(a)).toFixed(1) +
    ' ' +
    (-21 * Math.cos(a)).toFixed(1) +
    '" stroke="#20352a" stroke-width="4.5" stroke-linecap="round"/><circle cx="' +
    x +
    '" cy="' +
    y +
    '" r="3.5" fill="#20352a"/>'
  );
}
export function roomArt(n, { photo, faces, lights }) {
  const defs =
    '<defs><linearGradient id="sceneBack" x2="0" y2="1"><stop stop-color="#203039"/><stop offset="1" stop-color="#0d1a20"/></linearGradient><linearGradient id="side"><stop stop-color="#091316"/><stop offset="1" stop-color="#233339"/></linearGradient><linearGradient id="floor" x2="0" y2="1"><stop stop-color="#27302d"/><stop offset="1" stop-color="#080f14"/></linearGradient><linearGradient id="wood"><stop stop-color="#101b1f"/><stop offset=".5" stop-color="#3f3c2d"/><stop offset="1" stop-color="#141d1e"/></linearGradient><linearGradient id="mirror"><stop stop-color="#36585c"/><stop offset=".5" stop-color="#12282e"/><stop offset="1" stop-color="#213d40"/></linearGradient><radialGradient id="warm"><stop stop-color="#d9bb704f"/><stop offset=".35" stop-color="#c1a26415"/><stop offset="1" stop-color="#c6b27700"/></radialGradient><radialGradient id="cool"><stop stop-color="#87c7d029"/><stop offset="1" stop-color="#518c9800"/></radialGradient><pattern id="wallpaper" width="42" height="58" patternUnits="userSpaceOnUse"><path d="M21 3q19 14 0 30Q2 17 21 3Zm0 30v25" fill="none" stroke="#c3b98b11" stroke-width=".8"/></pattern><pattern id="boards" width="95" height="100" patternUnits="userSpaceOnUse"><rect width="95" height="100" fill="url(#floor)"/><path d="M0 0v100h95" fill="none" stroke="#9ba29010"/><path d="M7 9q38 8 80 0M11 46q44-8 69 0M20 76q29 6 57 0" fill="none" stroke="#a2ad8f09"/></pattern><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="3" seed="7" result="noise"/><feDiffuseLighting in="noise" lighting-color="#95a5a3" surfaceScale="1.5" diffuseConstant=".4" result="lit"><feDistantLight azimuth="210" elevation="35"/></feDiffuseLighting><feBlend in="SourceGraphic" in2="lit" mode="multiply"/></filter><filter id="blur"><feGaussianBlur stdDeviation="8"/></filter><filter id="soft"><feGaussianBlur stdDeviation="2"/></filter><clipPath id="window"><path d="M1110 480V165a92 92 0 0 1 184 0v315Z"/></clipPath><clipPath id="studyMirror"><path d="M640 375V140a125 125 0 0 1 250 0v235Z"/></clipPath></defs>';
  let base =
    '<rect width="1536" height="960" fill="#0a151b"/><path d="M0 0H1536L1250 155H270Z" fill="#101d23"/><path d="M270 155H1250V670H270Z" fill="url(#sceneBack)" filter="url(#rough)"/><rect x="270" y="155" width="980" height="515" fill="url(#wallpaper)"/><path d="M0 0L270 155V670L0 960Z" fill="url(#side)" filter="url(#rough)"/><path d="M1536 0L1250 155V670L1536 960Z" fill="#101d21" filter="url(#rough)"/><path d="M0 960L270 670H1250L1536 960Z" fill="url(#boards)"/><path d="M0 923L270 635H1250L1536 923M0 910L270 625H1250L1536 910" stroke="#7b867043" stroke-width="4" fill="none"/><path d="M0 20L270 173H1250L1536 20M0 43L270 187H1250L1536 43" stroke="#6e847c44" stroke-width="5" fill="none"/><path d="M270 500H1250M270 506H1250" stroke="#7e8d7422" stroke-width="3"/><g stroke="#8c977025" stroke-width="2">' +
    Array.from({ length: 13 }, (_, i) => '<path d="M' + (287 + i * 78) + ' 520v95h56v-95Z" fill="#10202655"/>').join('') +
    '</g><path d="M650 670L430 960M790 670L860 960M930 670L1310 960M0 810H1536M120 730H1420" fill="none" stroke="#788d7a17" stroke-width="2"/><path d="M650 685H940L1120 960H440Z" fill="#35413b33" stroke="#9d8d5b22" stroke-width="6"/><path d="M680 700H920L1060 960H510Z" fill="none" stroke="#9b835027" stroke-width="2"/>';
  let windowArt =
    '<image href="' +
    photo +
    '" x="1050" y="70" width="310" height="470" preserveAspectRatio="xMidYMid slice" clip-path="url(#window)" opacity=".65"/><path d="M1110 480V165a92 92 0 0 1 184 0v315ZM1202 75v405M1110 245h184M1110 360h184" fill="none" stroke="#090f14" stroke-width="14"/><path d="M1101 480V165a101 101 0 0 1 202 0v315Z" fill="none" stroke="#61776d77" stroke-width="8"/><path d="M1110 315L630 800L1060 890L1294 360Z" fill="#6aa7b70c"/><ellipse cx="1180" cy="380" rx="300" ry="390" fill="url(#cool)"/>';
  let chandelier =
    '<path d="M768 0v170" stroke="#58604c" stroke-width="3"/><path d="M700 190q68 75 136 0M725 180q43 50 86 0" fill="none" stroke="#7b7a554d" stroke-width="5"/><g fill="#cbbd7d">' +
    [700, 736, 800, 836]
      .map(
        (x, i) =>
          '<rect x="' +
          (x - 3) +
          '" y="' +
          (172 + (i === 1 || i === 2 ? 6 : 0)) +
          '" width="6" height="25" fill="#8b8d69"/><ellipse cx="' +
          x +
          '" cy="' +
          (169 + (i === 1 || i === 2 ? 6 : 0)) +
          '" rx="2.5" ry="6" fill="#dec88f"/>',
      )
      .join('') +
    '</g><ellipse cx="768" cy="195" rx="235" ry="220" fill="url(#warm)"/>';
  let deco = '';
  if (n === 0) {
    deco =
      '<path d="M645 660V300a125 125 0 0 1 250 0v360Z" fill="#0a1216" stroke="url(#wood)" stroke-width="23"/><path d="M770 200V660M662 480H875" fill="none" stroke="#7d7b4c33" stroke-width="3"/><path d="M665 338h87v125h-87ZM790 338h87v125h-87ZM665 495h87v138h-87ZM790 495h87v138h-87Z" fill="#0e1c1f" stroke="#8b805a27" stroke-width="3"/><path d="M790 515h20" stroke="#bda76a" stroke-width="5"/><rect x="530" y="220" width="485" height="142" fill="url(#mirror)" stroke="url(#wood)" stroke-width="15"/>' +
      [0, 1, 2, 3]
        .map(
          (i) =>
            '<circle cx="' +
            (595 + i * 118) +
            '" cy="287" r="46" fill="#768983" stroke="#9e9e794d" stroke-width="5"/><circle cx="' +
            (595 + i * 118) +
            '" cy="287" r="39" fill="#9aa48a"/>' +
            Array.from({ length: 12 }, (_, j) => {
              let t = (j * Math.PI) / 6;
              let x = 595 + i * 118,
                y = 287;
              return (
                '<path d="M' +
                (x + Math.sin(t) * 32) +
                ' ' +
                (y - Math.cos(t) * 32) +
                'l' +
                -Math.sin(t) * 5 +
                ' ' +
                Math.cos(t) * 5 +
                '" stroke="#25392e" stroke-width="2"/>'
              );
            }).join('') +
            '' +
            clockHands(595 + i * 118, 287, faces[i]) +
            '',
        )
        .join('') +
      '<rect x="269" y="280" width="185" height="255" fill="#16262b" stroke="url(#wood)" stroke-width="18"/><path d="M285 516q7-103 78-112q71 12 76 112" fill="#101c22"/><ellipse cx="363" cy="366" rx="42" ry="58" fill="#83938555"/><path d="M320 357q-7-80 44-68q58-6 42 80q-7-50-41-37q-34-5-45 25" fill="#13252c"/><rect x="1100" y="481" width="184" height="130" fill="#132026" stroke="url(#wood)" stroke-width="8"/>' +
      [0, 1, 2]
        .map(
          (i) =>
            '<circle cx="' +
            (1134 + i * 56) +
            '" cy="546" r="22" fill="#67715a" stroke="#a2986255" stroke-width="4"/><circle cx="' +
            (1134 + i * 56) +
            '" cy="546" r="8" fill="#122127"/>',
        )
        .join('') +
      '<rect x="142" y="510" width="57" height="103" rx="10" fill="#203035" stroke="#7b89715d" stroke-width="3"/><path d="M157 532h27m-27 9h27m-27 9h27" stroke="#788e7a" stroke-width="2"/><path d="M270 620h220l20 19H243Z" fill="url(#wood)"/><path d="M270 637l-8 160m224-160l13 160" stroke="#182728" stroke-width="13"/><path d="M315 612l60-16 65 15-64 11Z" fill="#bcaf8a88"/>';
  } else if (n === 1) {
    deco = '';
    for (let s = 0; s < 4; s++) {
      let x = 290 + s * 236;
      deco += '<rect x="' + x + '" y="180" width="214" height="458" fill="#0a151a" stroke="url(#wood)" stroke-width="13"/>';
      for (let row = 0; row < 4; row++) {
        deco += '<path d="M' + (x + 6) + ' ' + (286 + row * 106) + 'h202" stroke="#887e5566" stroke-width="7"/>';
        for (let b = 0; b < 13; b++) {
          let h = 68 + ((b * 13 + row * 17 + s * 11) % 31);
          deco +=
            '<rect x="' +
            (x + 10 + b * 14.5) +
            '" y="' +
            (282 + row * 106 - h) +
            '" width="' +
            (10 + (b % 3)) +
            '" height="' +
            h +
            '" rx="1" fill="' +
            ['#45534a', '#615945', '#2c4144', '#5b5940', '#434f43'][b % 5] +
            '" stroke="#b4a37b18"/><path d="M' +
            (x + 11 + b * 14.5) +
            ' ' +
            (291 + row * 106 - h) +
            'h7m-7 ' +
            (h - 21) +
            'h7" stroke="#bdad7b44" stroke-width="1"/>';
        }
      }
    }
    deco +=
      '<rect x="269" y="230" width="180" height="230" fill="#17292b" stroke="url(#wood)" stroke-width="18"/><path d="M285 445q8-92 73-102q62 6 76 102" fill="#3e514a"/><ellipse cx="357" cy="307" rx="34" ry="46" fill="#9ca7909f"/><path d="M322 312q-17-88 37-77q62-2 35 98l-11-40q-19-17-48 5l-7 54Z" fill="#16282e"/><path d="M340 310h9m16 0h9" stroke="#273d3c" stroke-width="3"/><path d="M1065 410h228v84h-228Z" fill="#13262a" stroke="#837956" stroke-width="6"/><text x="1082" y="465" fill="#ada980" opacity=".7" font-size="34">◉ ☾ ♞ ⚿ ☀</text><path d="M335 575l115-25 111 29-113 38Z" fill="url(#wood)" stroke="#8c8763" stroke-width="3"/><path d="M446 610v199m-30 0h64" stroke="#243735" stroke-width="16"/><path d="M350 572l92-12 100 18-94 25Z" fill="#c2b48d99"/><path d="M443 563l6 34" stroke="#665e4055" stroke-width="2"/><rect x="752" y="360" width="72" height="68" fill="#09171d" stroke="#a4a16f77" stroke-width="5"/>';
  } else {
    deco =
      '<path d="M631 388V137a134 134 0 0 1 268 0v251Z" fill="url(#wood)" stroke="#7c82608c" stroke-width="7"/><path d="M649 370V140a116 116 0 0 1 232 0v230Z" fill="url(#mirror)"/><image href="' +
      photo +
      '" x="620" y="75" width="300" height="330" clip-path="url(#studyMirror)" opacity=".14"/><path d="M697 371q4-100 67-128q70 18 74 128" fill="#8faaa00c" filter="url(#soft)"/><ellipse cx="765" cy="200" rx="36" ry="53" fill="#a9c0b51a" filter="url(#soft)"/><path d="M727 192q-3-70 40-68q57 7 36 102l-16-56-47 9Z" fill="#10252c8a"/><rect x="1090" y="451" width="210" height="188" rx="7" fill="#293c3d" stroke="#6a7e7155" stroke-width="9"/><rect x="1110" y="470" width="170" height="151" rx="4" fill="#182c30" stroke="#82918166" stroke-width="3"/><circle cx="1195" cy="546" r="30" fill="#233c3c" stroke="#91a28a66" stroke-width="5"/><path d="M1174 546h42m-21-21v42" stroke="#a4ad8c" stroke-width="5"/><path d="M322 625H1005L1128 760H230Z" fill="url(#wood)" stroke="#8b8a6077" stroke-width="4"/><path d="M272 760l-15 200m822-200l20 200" stroke="#1d3030" stroke-width="27"/><path d="M339 635l110-16 73 29-110 19Z" fill="#c7b79199"/><path d="M670 620h207l54 85H624Z" fill="#13282b" stroke="#a39c6c88" stroke-width="6"/>';
    for (let i = 0; i < 9; i++) {
      let lit = lights && lights[i];
      deco +=
        '<ellipse cx="' +
        (690 + (i % 3) * 67) +
        '" cy="' +
        (636 + Math.floor(i / 3) * 24) +
        '" rx="13" ry="8" data-scene-light="' +
        i +
        '" fill="' +
        (lit ? '#c4b276' : '#263b38') +
        '" stroke="#929e7366" stroke-width="2"/>';
    }
    deco +=
      '<path d="M970 606v-67h30v67" fill="#777b5c"/><ellipse cx="985" cy="532" rx="4" ry="11" fill="#e0c489"/><ellipse cx="985" cy="535" rx="180" ry="180" fill="url(#warm)"/>';
  }
  let cracks =
    '<g fill="none" stroke="#020b0e99" stroke-width="2"><path d="M465 180l-14 70 11 35-23 59m22-57l27 19M1010 190l-24 61 13 28-14 45M290 398l32 29-14 27M1070 580l-25 19 11 20"/></g><path d="M280 197L360 255M280 197L290 278M280 197L403 209M280 197Q322 225 290 278M280 197Q355 226 403 209" fill="none" stroke="#9bb5ad15" stroke-width="1"/>';
  return (
    '<svg class="scene-svg" viewBox="0 0 1536 960" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    defs +
    base +
    windowArt +
    deco +
    chandelier +
    cracks +
    '<rect width="1536" height="960" fill="#00141b22"/></svg>'
  );
}
