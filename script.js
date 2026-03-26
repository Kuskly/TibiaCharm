// 🔍 Busca nome correto
async function searchMonster(monsterName) {
  const url = `https://tibia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(monsterName)}&format=json&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.query.search.length) return null;

  return data.query.search[0].title;
}


// 🔥 Busca conteúdo RAW
async function fetchRawPage(title) {
  const url = `https://tibia.fandom.com/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=${encodeURIComponent(title)}&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  const page = Object.values(data.query.pages)[0];

  if (!page.revisions) return null;

  return page.revisions[0]["*"];
}


// 🔥 PARSER CORRIGIDO (AGORA FUNCIONA)
function extractWeakness(rawText) {
  const elements = ["physical", "death", "holy", "ice", "fire", "energy", "earth", "drown"];
  const values = {};

  elements.forEach(el => {
    const regex = new RegExp(`${el}\\s*=\\s*(\\d+)`, "i");
    const match = rawText.match(regex);

    if (match) {
      values[el.charAt(0).toUpperCase() + el.slice(1)] = parseInt(match[1]);
    }
  });

  if (Object.keys(values).length === 0) {
    console.log("⚠️ Nenhum elemento encontrado no raw");
    return null;
  }

  const weakness = Object.keys(values).reduce((a, b) =>
    values[a] > values[b] ? a : b
  );

  return { weakness, value: values[weakness], all: values };
}


// 🔥 PIPELINE
async function fetchWeakness(monsterName) {
  try {
    const correctName = await searchMonster(monsterName);

    if (!correctName) {
      console.log("❌ Não encontrado:", monsterName);
      return null;
    }

    console.log("🔍 Nome correto:", correctName);

    const raw = await fetchRawPage(correctName);

    if (!raw) {
      console.log("❌ Sem conteúdo:", correctName);
      return null;
    }

    const result = extractWeakness(raw);

    console.log("📊 Fraqueza:", result);

    return result;

  } catch (err) {
    console.log("🔥 Erro:", monsterName, err);
    return null;
  }
}


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


// 🚀 ANALYZE
async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  const mobs = parseInput(input);

  if (!mobs.length) {
    resultEl.innerText = "Nenhum mob encontrado.";
    return;
  }

  const total = mobs.reduce((sum, m) => sum + m.count, 0);

  let results = [];
  let elementScore = {};

  for (const mob of mobs) {
    const percent = (mob.count / total) * 100;

    const data = await fetchWeakness(mob.name);

    if (!data) continue;

    results.push({
      name: mob.name,
      percent: percent.toFixed(2),
      weakness: data.weakness,
      value: data.value
    });

    if (!elementScore[data.weakness]) {
      elementScore[data.weakness] = 0;
    }

    elementScore[data.weakness] += percent;
  }

  const keys = Object.keys(elementScore);

  if (!keys.length) {
    resultEl.innerText =
      "❌ Nenhuma fraqueza encontrada.\n\n" +
      "Abra o console (F12) para debug.";
    return;
  }

  const bestElement = keys.reduce((a, b) =>
    elementScore[a] > elementScore[b] ? a : b,
    keys[0]
  );

  let output = "📊 Resultado da Hunt\n\n";

  results.forEach(r => {
    output += `🧟 ${r.name} (${r.percent}%) → ${r.weakness} (${r.value}%)\n`;
  });

  output += `\n🔥 Melhor elemento geral: ${bestElement}\n`;

  resultEl.innerText = output;
}
