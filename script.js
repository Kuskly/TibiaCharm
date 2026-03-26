async function analyze() {
  const name = document.getElementById("monster").value.trim();
  const resultEl = document.getElementById("result");

  if (!name) {
    resultEl.innerText = "Digite o nome do monstro.";
    return;
  }

  const url = `https://tibia.fandom.com/wiki/${name.replace(/ /g, "_")}`;
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxy);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const values = {};
    const validElements = ["Physical", "Death", "Holy", "Ice", "Fire", "Energy", "Earth", "Drown"];

    const lines = doc.body.innerText.split("\n");

    lines.forEach(line => {
      validElements.forEach(el => {
        if (line.toLowerCase().includes(el.toLowerCase())) {
          const match = line.match(/(\d+)%/);
          if (match) {
            values[el] = parseInt(match[1]);
          }
        }
      });
    });

    if (Object.keys(values).length === 0) {
      resultEl.innerText = "Não encontrou dados de fraqueza.";
      return;
    }

    const weakness = Object.keys(values).reduce((a, b) =>
      values[a] > values[b] ? a : b
    );

    resultEl.innerText =
      `📊 ${name}\n\n` +
      `🔥 Maior fraqueza: ${weakness} (${values[weakness]}%)\n\n` +
      JSON.stringify(values, null, 2);

  } catch (err) {
    resultEl.innerText = "Erro: " + err.message;
  }
}
