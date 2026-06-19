export function buildShareText({ score, totalCo2Kg, firstNudgeAction, breakdown }) {
  const tonsCo2 = (totalCo2Kg / 1000).toFixed(2);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecomirror-virid.vercel.app';

  const rating = score <= 33
    ? 'Low Impact (Eco-Balanced)'
    : score <= 66
      ? 'Moderate Impact (Degrading Ecosystem)'
      : 'High Impact (Ecological Crisis)';

  const insight = (() => {
    if (!breakdown) return 'Most of us have no idea how much our daily habits contribute to carbon emissions.';
    const entries = Object.entries(breakdown).sort(([,a],[,b]) => b - a);
    const [topCat, topVal] = entries[0];
    const topTons = (topVal / 1000).toFixed(1);
    const labels = {
      transport: 'daily commute',
      flights: 'air travel',
      diet: 'food choices',
      energy: 'home energy use',
      shopping: 'shopping habits'
    };
    return `Your biggest contributor is ${labels[topCat] || topCat} at ${topTons} tons CO\u2082/year \u2014 that's ${Math.round((topVal / totalCo2Kg) * 100)}% of your total footprint.`;
  })();

  const action = firstNudgeAction || "Optimizing daily commuting habits";

  return `I just discovered my carbon footprint is ${tonsCo2} tons CO\u2082/year \u2014 ${rating}.

Here's the insight that hit hardest: ${insight}

My top action plan: ${action}

Checked mine on EcoMirror \u2014 a 5-question AI chat that calculates your carbon footprint and shows its impact on a live 3D world.

Check yours: ${appUrl}

#CarbonFootprint #Sustainability #EcoMirror #Google #Gemini #AI #ClimateAction`;
}