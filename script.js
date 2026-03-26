console.log("SCRIPT CARREGADO");

// 🔍 Parse input
function parseInput(text) {
  const lines = text.split("\n");
  const mobs = [];

  lines.forEach(line => {
    const match = line.match(/(\d+)x\s+(.+)/i);
    if (match) {
      mobs.push({
        count: parseInt(match[1]),
        name: match[2].trim()
      });
    }
  });

  return mobs;
}


// 🔍 Busca nome correto
async function searchMonster(monsterName) {
  const url = `https://tibia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(monsterName)}&format=json&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.query.search.length) return null;

  return data.query.search[0].title;
}


// 🔥 Busca wikitext
async function fetchWikiText(title) {
  const url = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&prop=wikitext&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.parse) return null;

  return data.parse.wikitext["*"];
}


// 🔥 Extrai dados
function extractData(wikiText) {
  const elements = [
    "physical","earth","fire","death",
    "energy","holy","ice","drown"
  ];

  const values = {};

  elements.forEach(el => {
    const match = wikiText.match(new RegExp(`${el}DmgMod\\s*=\\s*(\\d+)%`, "i"));
    if (match) values[el] = parseInt(match[1]);
  });

  const hpMatch = wikiText.match(/hp\s*=\s*(\d+)/i);
  const hp = hpMatch ? parseInt(hpMatch[1]) : null;

  if (!hp || Object.keys(values).length === 0) return null;

  return { hp, elements: values };
}


// 🔥 Pipeline
async function fetchMonsterData(name) {
  const correct = await searchMonster(name);
  if (!correct) return null;

  const wikiText = await fetchWikiText(correct);
  if (!wikiText) return null;

  return extractData(wikiText);
}


// 🚀 ANALYZE FINAL (SEM REPETIR ELEMENTO)
async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  resultEl.innerText = "🔄 Analisando...";

  const mobs = parseInput(input);

  if (!mobs.length) {
    resultEl.innerText = "Nenhum mob encontrado.";
    return;
  }

  let combinations = [];

  for (const mob of mobs) {
    const data = await fetchMonsterData(mob.name);
    if (!data) continue;

    const { hp, elements } = data;

    Object.keys(elements).forEach(el => {
      const multiplier = elements[el] / 100;
      const score = hp * mob.count * multiplier;

      combinations.push({
        mob: mob.name,
        element: el,
        score: score
      });
    });
  }

  // ordenar por impacto
  combinations.sort((a, b) => b.score - a.score);

  let usedMobs = new Set();
  let usedElements = new Set();
  let final = [];

  for (const combo of combinations) {
    if (!usedMobs.has(combo.mob) && !usedElements.has(combo.element)) {
      final.push(combo);
      usedMobs.add(combo.mob);
      usedElements.add(combo.element);
    }
  }

  let output = "🎯 Distribuição ótima de charms\n\n";

  final.forEach(f => {
    output += `🧟 ${f.mob} → ${f.element.toUpperCase()}\n`;
  });

  resultEl.innerText = output;
}
