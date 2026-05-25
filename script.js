async function generateIdea() {
    const apiKey = document.getElementById('apiKey').value;
    const insp1 = document.getElementById('insp1').value;
    const insp2 = document.getElementById('insp2').value;
    const format = document.getElementById('format').value;
    const btn = document.getElementById('generateBtn');
    const outputBox = document.getElementById('outputBox');
    const resultContent = document.getElementById('resultContent');

    if (!apiKey || !insp1 || !insp2) {
        alert("Bitte fülle den API-Key und beide Inspirations-Felder aus! 😉");
        return;
    }

    // Button-Animation/Status ändern
    btn.innerText = "Kreativ-Säfte werden gemischt... 🧪";
    btn.disabled = true;

    // Der geheime System-Prompt, der der KI sagt, wie sie sich verhalten soll
    const systemPrompt = `Du bist ein genialer Content-Creator-Stratege für die VRChat- und Furry-Bubble auf TikTok und YouTube. 
    Deine Aufgabe ist es, zwei getrennte Video-Ideen/Inspirationen zu nehmen und sie kreativ zu einer völlig neuen, witzigen Video-Idee zu fusionieren.
    Das Ergebnis MUSS folgendes beinhalten:
    1. Einen extrem klickstarken, packenden Titel (passend zum Format).
    2. Eine kurze Beschreibung des Plots (inklusive wie die beiden Inspirationen kombiniert werden).
    3. Die Key-Momente/Gags (Stichpunkte für die Umsetzung, kein langes Skript, sondern Inspirationen).
    
    Passe den Schreibstil an das gewählte Format an (${format === 'tiktok' ? 'Schneller TikTok/Short-Vibe' : 'Spannendes YouTube-Langform-Video'}).`;

    const userPrompt = `Fusioniere diese beiden Ideen:\nIdee 1: ${insp1}\nIdee 2: ${insp2}`;

    try {
        // Hier nutzen wir beispielhaft die OpenAI API Schnittstelle (funktioniert ähnlich für Claude/Anthropic)
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Schnelles und günstiges Modell für solche Ideen
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.8 // Höhere Kreativität
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const generatedText = data.choices[0].message.content;
            // Text formatieren (Markdown in einfaches HTML umwandeln für Zeilenumbrüche)
            resultContent.innerHTML = generatedText.replace(/\n/g, '<br>');
            outputBox.classList.remove('hidden');
        } else {
            resultContent.innerText = "Fehler bei der API-Antwort. Überprüfe deinen Key!";
            outputBox.classList.remove('hidden');
        }

    } catch (error) {
        console.error("API Error:", error);
        resultContent.innerText = "Ups! Da ist beim Verbinden etwas schiefgelaufen. Schau mal in die Konsole.";
        outputBox.classList.remove('hidden');
    } finally {
        btn.innerText = "Ideen fusionieren ✨";
        btn.disabled = false;
    }
}