// 🔥 PROXY (resolve CORS + pega HTML real)
const PROXY = "https://api.allorigins.win/raw?url=";


// 🔍 Busca página HTML real
async function fetchPageHTML(monsterName) {
  const urlName = monsterName
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ /g, "_");

  const url = `https://tibia.fandom.com/wiki/${urlName}`;

  try {
    const res = await fetch(PROXY + encodeURIComponent(url));
    const html = await res.text();

    return html;
  } catch (err) {
    console.log("Erro ao buscar HTML:", err);
    return null;
  }
}


// 🔥 EXTRAI FRAQUEZA DO HTML REAL
function extractWeaknessFromHTML(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const text = doc.body.innerText;

  const elements = ["Physical", "Death", "Holy", "Ice", "Fire", "Energy", "Earth", "Drown"];
  const values = {};

  elements.forEach(el => {
    const regex = new RegExp(`${el}\\s*(\\d+)%`, "i");
    const match = text.match(regex);

    if (match) {
      values[el] = parseInt(match[1]);
    }
  });

  if (!Object.keys(values).length) {
    console.log("⚠️ Não encontrou resistências no HTML");
    return null;
  }

  const weakness = Object.keys(values).reduce((a, b) =>
    values[a] > values[b] ? a : b
  );

  return { weakness, value: values[weakness], all: values };
}


// 🔥 PIPELINE
async function fetchWeakness(monsterName) {
  const html = await fetchPageHTML(monsterName);

  if (!html) return null;

  const result = extractWeaknessFromHTML(html);

  console.log("📊", monsterName, result);

  return result;
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
    resultEl.innerText = "❌ Nenhuma fraqueza encontrada.";
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
