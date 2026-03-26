console.log("SCRIPT CARREGADO");

// 🔍 UI dinâmica
function handleCharmChange() {
  const type = document.getElementById("charmType").value;
  const input = document.getElementById("charmValue");

  if (!type) {
    input.style.display = "none";
    return;
  }

  input.style.display = "block";

  if (type === "overflux") {
    input.placeholder = "Digite sua mana";
  } else {
    input.placeholder = "Digite sua vida";
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


// 🔍 API
async function searchMonster(name) {
  const url = `https://tibia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.query.search.length) return null;
  return data.query.search[0].title;
}

async function fetchWikiText(title) {
  const url = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&prop=wikitext&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.parse) return null;
  return data.parse.wikitext["*"];
}

function extractData(wikiText) {
  const elements = ["physical","earth","fire","death","energy","holy","ice","drown"];
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

async function fetchMonsterData(name) {
  const correct = await searchMonster(name);
  if (!correct) return null;
  const wikiText = await fetchWikiText(correct);
  if (!wikiText) return null;
  return extractData(wikiText);
}


// 🚀 ANALYZE COMPLETO
async function analyze() {
  const input = document.getElementById("input").value;
  const resultEl = document.getElementById("result");

  const charmType = document.getElementById("charmType").value;
  const charmValue = parseFloat(document.getElementById("charmValue").value);

  resultEl.innerText = "🔄 Analisando...";

  const mobs = parseInput(input);
  if (!mobs.length) {
    resultEl.innerText = "Nenhum mob encontrado.";
    return;
  }

  let combinations = [];
  let mobDataList = [];

  // 🔥 coleta dados
  for (const mob of mobs) {
    const data = await fetchMonsterData(mob.name);
    if (!data) continue;

    mobDataList.push({
      name: mob.name,
      count: mob.count,
      hp: data.hp,
      elements: data.elements
    });

    Object.keys(data.elements).forEach(el => {
      const score = data.hp * mob.count * (data.elements[el] / 100);

      combinations.push({
        mob: mob.name,
        element: el,
        score
      });
    });
  }

  // 🔥 solução base
  combinations.sort((a, b) => b.score - a.score);

  let usedMobs = new Set();
  let usedElements = new Set();
  let base = [];

  for (const c of combinations) {
    if (!usedMobs.has(c.mob) && !usedElements.has(c.element)) {
      base.push(c);
      usedMobs.add(c.mob);
      usedElements.add(c.element);
    }
  }

  // 🔥 calcula valor da hunt (A%x + B%y ...)
  let total = 0;
  let totalKills = mobs.reduce((a, b) => a + b.count, 0);

  base.forEach(b => {
    const mob = mobDataList.find(m => m.name === b.mob);
    const percent = mob.count / totalKills;
    const damage = mob.hp * (b.score / (mob.hp * mob.count));
    total += percent * damage;
  });

  // 🔥 calcula charm
  let charmDamage = 0;

  if (charmType === "overflux") {
    charmDamage = charmValue / 40;
  }

  if (charmType === "overpower") {
    charmDamage = charmValue / 20;
  }

  let final = [...base];

  // 🔥 decide substituir
  if (charmType && charmValue && charmDamage > total) {
    // remove melhor mob
    const removed = final.shift();

    // redistribui elementos sem repetir
    usedMobs = new Set();
    usedElements = new Set();
    final = [];

    for (const c of combinations) {
      if (!usedMobs.has(c.mob) && !usedElements.has(c.element)) {
        final.push(c);
        usedMobs.add(c.mob);
        usedElements.add(c.element);
      }
    }

    final.unshift({
      mob: removed.mob,
      element: charmType.toUpperCase(),
      score: charmDamage
    });
  }

  // 🔥 saída
  let output = "🎯 Distribuição ótima\n\n";

  final.forEach(f => {
    output += `🧟 ${f.mob} → ${f.element.toUpperCase()}\n`;
  });

  resultEl.innerText = output;
}
