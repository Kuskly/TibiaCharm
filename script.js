async function analyze() {
  const name = document.getElementById("monster").value.trim();
  const resultEl = document.getElementById("result");

  if (!name) {
    resultEl.innerText = "Digite o nome do monstro.";
    return;
  }

  // 🔥 Corrige nome da página
  const pageName = name
    .trim()
    .replace(/ /g, "_")
    .replace(/__+/g, "_");

  // 🔥 API com CORS liberado
  const apiUrl = `https://tibia.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&format=json&origin=*`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // 🔍 Debug (pode remover depois)
    console.log("API URL:", apiUrl);
    console.log("API Response:", data);

    if (!data.parse) {
      resultEl.innerText = "Página não encontrada.";
      return;
    }

    const html = data.parse.text["*"];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const values = {};
    const elements = ["Physical", "Death", "Holy", "Ice", "Fire", "Energy", "Earth", "Drown"];

    // 🔥 pega todo texto da página
    const lines = doc.body.textContent.split("\n");

    lines.forEach(line => {
      elements.forEach(el => {
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
