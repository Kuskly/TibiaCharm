// 🔍 Busca nome correto do mob
async function searchMonster(monsterName) {
  const url = `https://tibia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(monsterName)}&format=json&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.query.search.length) return null;

  return data.query.search[0].title;
}


// 🔥 Busca WIKITEXT
async function fetchWikiText(title) {
  const url = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&prop=wikitext&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.parse) {
    console.log("❌ Página não encontrada:", title);
    return null;
  }

  return data.parse.wikitext["*"];
}


// 🔥 Extrai HP + TODOS elementos
function extractData(wikiText) {
  const elements = [
    "physical", "earth", "fire", "death",
    "energy", "holy", "ice", "drown"
  ];

  const values = {};

  elements.forEach(el => {
    const regex = new RegExp(`${el}DmgMod\\s*=\\s*(\\d+)%`, "i");
    const match = wikiText.match(regex);

    if (match) {
      values[el] = parseInt(match[1]);
    }
  });

  // 🔥 pega HP
  const hpMatch = wikiText.match(/hp\s*=\s*(\d+)/i);
  const hp = hpMatch ? parseInt(hpMatch[1]) : null;

  if (!hp || Object.keys(values).length === 0) {
    console.log("⚠️ Dados incompletos");
    return null;
  }

  return { hp, elements: values };
}


// 🔥 Pipeline completo
async function fetchMonsterData(monsterName) {
  try {
    const correctName = await searchMonster(monsterName);

    if (!correctName) {
      console.log("❌ Não encontrado:", monsterName);
      return null;
    }

    console.log("🔍 Nome correto:", correctName);

    const wikiText = await fetchWikiText(correctName);

    if (!wikiText) return null;

    const result = extractData(wikiText);

    console.log("📊 Dados:", result);

    return result;

  } catch (err) {
    console.log("🔥 Erro:", monsterName, err);
    return null;
  }
}


// 🔍 Parse do input
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


// 🚀 FUNÇÃO PRINCIPAL (ALGORITMO TIBIAMAPS)
async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  const mobs = parseInput(input);

  if (!mobs.length) {
    resultEl.innerText = "Nenhum mob encontrado.";
    return;
  }

  let elementScore = {};

  for (const mob of mobs) {
    const data = await fetchMonsterData(mob.name);

    if (!data) continue;

    const { hp, elements } = data;

    Object.keys(elements).forEach(el => {
      const multiplier = elements[el] / 100;

      if (!elementScore[el]) {
        elementScore[el] = 0;
      }

      // 🔥 Fórmula do TibiaMaps
      elementScore[el] += hp * mob.count * multiplier;
    });
  }

  const keys = Object.keys(elementScore);

  if (!keys.length) {
    resultEl.innerText = "❌ Nenhum dado encontrado.";
    return;
  }

  // 🔥 ordena ranking
  const sorted = keys.sort((a, b) => elementScore[b] - elementScore[a]);

  const bestElement = sorted[0];

  let output = "📊 Eficiência por elemento\n\n";

  sorted.forEach(el => {
    output += `${el.toUpperCase()}: ${Math.round(elementScore[el])}\n`;
  });

  output += `\n🔥 Melhor elemento: ${bestElement.toUpperCase()}`;

  resultEl.innerText = output;
}
