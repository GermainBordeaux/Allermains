// app.js (ESM)
// Configuré par Copilot : TODO ne pas mettre la service_role dans ce fichier
const SUPABASE_URL = "https://ptujuyctoapckraxaurq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dWp1eWN0b2FwY2tyYXhhdXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MzU2MjEsImV4cCI6MjEwNDUxMTYyMX0.3e4Q4XUPPsn9Px-6ITtOfItlnbxjsI2XAIcS4FElcIw";
// URL présumée de la Supabase Edge Function (déployez la function et modifie si besoin)
const REDEEM_FUNCTION_URL = "https://ptujuyctoapckraxaurq.functions.supabase.co/redeem-card"; // ex: https://<project>.functions.supabase.co/redeem-card

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const authArea = document.getElementById("auth-area");
const authEmail = document.getElementById("auth-email");
const authAction = document.getElementById("auth-action");
const emailInput = document.getElementById("email-input");
const passInput = document.getElementById("pass-input");
const btnSignin = document.getElementById("btn-signin");
const btnSignup = document.getElementById("btn-signup");
const authMsg = document.getElementById("auth-msg");

const redeemPanel = document.getElementById("redeem-panel");
const codeInput = document.getElementById("code-input");
const btnRedeem = document.getElementById("btn-redeem");
const redeemMsg = document.getElementById("redeem-msg");

const deckList = document.getElementById("deck-list");

function showMsg(elem, text, type = "muted") {
  elem.textContent = text || "";
  if (!text) return;
  elem.className = type === "error" ? "muted small" : "muted small";
}

// Auth helpers
async function updateAuthUI() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user || null;
  if (user) {
    authEmail.textContent = user.email;
    authAction.style.display = "inline-block";
    document.getElementById("auth-forms").style.display = "none";
    redeemPanel.style.display = "block";
    loadDeck(user.id);
  } else {
    authEmail.textContent = "Invité";
    authAction.style.display = "none";
    document.getElementById("auth-forms").style.display = "block";
    redeemPanel.style.display = "none";
    deckList.innerHTML = "<div class='placeholder'>Connecte-toi pour afficher ton deck</div>";
  }
}

btnSignup.addEventListener("click", async () => {
  showMsg(authMsg, "");
  const email = emailInput.value.trim();
  const password = passInput.value;
  if (!email || !password) { showMsg(authMsg, "Email et mot de passe requis", "error"); return; }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) showMsg(authMsg, error.message, "error");
  else showMsg(authMsg, "Vérifie ta boîte mail si activation requise.", "muted");
});

btnSignin.addEventListener("click", async () => {
  showMsg(authMsg, "");
  const email = emailInput.value.trim();
  const password = passInput.value;
  if (!email || !password) { showMsg(authMsg, "Email et mot de passe requis", "error"); return; }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) showMsg(authMsg, error.message, "error");
  else {
    showMsg(authMsg, "Connecté", "muted");
    await updateAuthUI();
  }
});

authAction.addEventListener("click", async () => {
  await supabase.auth.signOut();
  await updateAuthUI();
});

supabase.auth.onAuthStateChange(() => { updateAuthUI(); });

// Redeem
btnRedeem.addEventListener("click", async () => {
  showMsg(redeemMsg, "");
  const code = (codeInput.value || "").trim();
  if (!/^\d{7}$/.test(code)) { showMsg(redeemMsg, "Le code doit contenir 7 chiffres.", "error"); return; }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) { showMsg(redeemMsg, "Connecte-toi d'abord.", "error"); return; }

  try {
    const res = await fetch(REDEEM_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ code })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMsg(redeemMsg, json.error || `Erreur (${res.status})`, "error");
      return;
    }
    showMsg(redeemMsg, `Carte ajoutée : ${json.card?.name || json.card?.code}`, "muted");
    codeInput.value = "";
    const user = session.user;
    loadDeck(user.id);
  } catch (err) {
    console.error(err);
    showMsg(redeemMsg, "Erreur réseau.", "error");
  }
});

// Load deck
async function loadDeck(userId) {
  deckList.innerHTML = "<div class='placeholder'>Chargement…</div>";
  try {
    const { data, error } = await supabase
      .from("cards")
      .select("id, code, name, description, image_url, claimed_at")
      .eq("claimed_by", userId)
      .order("claimed_at", { ascending: false });

    if (error) {
      deckList.innerHTML = `<div class="placeholder">Impossible de charger les cartes : ${error.message}</div>`;
      return;
    }
    if (!data || data.length === 0) {
      deckList.innerHTML = `<div class="placeholder">Aucune carte pour l'instant</div>`;
      return;
    }
    deckList.innerHTML = data.map(renderCard).join("");
  } catch (err) {
    console.error(err);
    deckList.innerHTML = `<div class="placeholder">Erreur lors du chargement</div>`;
  }
}

function renderCard(c) {
  const thumb = c.image_url ? `<img class="thumb" src="${escapeHtml(c.image_url)}" alt="">` : '';
  return `
    <div class="card-item">
      ${thumb}
      <div>
        <div style="font-weight:700">${escapeHtml(c.name || c.code)}</div>
        <div class="muted small">${escapeHtml(c.description || '')}</div>
        <div class="muted small">Code: ${escapeHtml(c.code)}</div>
      </div>
    </div>
  `;
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// Init
(async function init() {
  if (SUPABASE_URL.includes("REPLACE") || SUPABASE_ANON_KEY.includes("REPLACE") || REDEEM_FUNCTION_URL.includes("REPLACE")) {
    deckList.innerHTML = "<div class='placeholder'>Configure SUPABASE_URL, SUPABASE_ANON_KEY et REDEEM_FUNCTION_URL dans app.js</div>";
    return;
  }
  await updateAuthUI();
})();
