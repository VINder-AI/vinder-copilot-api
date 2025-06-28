window.addEventListener("DOMContentLoaded", () => {
  const embedStyles = `
    #vinder-chat * { box-sizing: border-box; font-family: Arial, sans-serif; }
    #vinder-chat {
      max-width: 900px; margin: 30px auto; background: white;
      border-radius: 16px; box-shadow: 0 0 30px rgba(0,0,0,0.07);
      display: flex; flex-direction: column; overflow: hidden;
    }
    #vinder-messages {
      flex: 1; padding: 20px; height: 550px;
      overflow-y: auto; scroll-behavior: smooth;
      background: #FAF7FF;
    }
    .msg {
      padding: 12px 16px; border-radius: 14px; margin: 10px 0;
      max-width: 80%; white-space: pre-wrap; word-break: break-word;
    }
    .user {
      align-self: flex-end; background: #E0E0E0; text-align: right;
    }
    .bot {
      align-self: flex-start; background: #EDE2FF; color: #333;
    }
    #vinder-form {
      display: flex; border-top: 1px solid #ddd;
    }
    #vinder-input {
      flex: 1; border: none; padding: 16px; font-size: 17px;
      outline: none;
    }
    #vinder-send {
      background: #A166FF; color: white; border: none;
      padding: 0 26px; font-size: 17px; cursor: pointer;
      transition: background 0.3s; font-weight: bold;
    }
    #vinder-send:disabled { background: #cdb8f9; cursor: not-allowed; }
  `;

  const embedHTML = `
    <style>${embedStyles}</style>
    <div id="vinder-messages"></div>
    <form id="vinder-form">
      <input id="vinder-input" type="text" placeholder="Type your question about any EV…" />
      <button type="submit" id="vinder-send">Ask</button>
    </form>
  `;

  const chatRoot = document.getElementById("vinder-chat");
  if (!chatRoot) return;
  chatRoot.innerHTML = embedHTML;

  const messagesEl = document.getElementById("vinder-messages");
  const inputEl = document.getElementById("vinder-input");
  const sendBtn = document.getElementById("vinder-send");

  function appendMessage(role, text) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.innerText = text;
    messagesEl.appendChild(div);
    div.scrollIntoView({ behavior: "smooth" });
    return div;
  }

  async function sendInitialZipPrompt() {
    appendMessage("bot", "To get started, what’s your ZIP code?");
  }

  document.getElementById("vinder-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const userInput = inputEl.value.trim();
    if (!userInput) return;

    inputEl.value = "";
    sendBtn.disabled = true;
    appendMessage("user", userInput);
    const botDiv = appendMessage("bot", "");

    const res = await fetch("https://vinder-copilot-api.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: userInput })
    });

    if (!res.ok || !res.body) {
      botDiv.innerText = "⚠️ Error. Please try again.";
      sendBtn.disabled = false;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            sendBtn.disabled = false;
            return;
          }
          try {
            const data = JSON.parse(json);
            if (data?.delta?.content?.[0]?.text?.value) {
              botDiv.innerText += data.delta.content[0].text.value;
            }
          } catch (err) {
            console.warn("Parse error:", err);
          }
        }
      }
    }

    sendBtn.disabled = false;
  });

  sendInitialZipPrompt();
});
