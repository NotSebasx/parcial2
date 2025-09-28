const $ = (sel) => document.querySelector(sel);
const api = (p, opts = {}) =>
  fetch(
    p,
    Object.assign({ headers: { "Content-Type": "application/json" } }, opts)
  );

const state = {
  cliente: null,
};

function setStatus(msg) {
  $("#estado").textContent = msg || "";
}

function showApp() {
  if (state.cliente) {
    $("#mensaje-bienvenida").textContent = `Hola, ${state.cliente.nombre} (ID ${state.cliente.id})`;
    $("#panel").classList.remove("oculto");
    $("#acceso").classList.add("oculto");
    cargarOrdenes();
  }
}

function cargarOrdenes() {
  api(`/ordenes/${state.cliente.id}`)
    .then((r) => r.json())
    .then((data) => {
      const cont = $("#ordenes-lista");
      cont.innerHTML = "";
      if (!Array.isArray(data) || data.length === 0) {
        cont.innerHTML = "<p>No tienes pedidos todavía.</p>";
        return;
      }
      data.forEach((o) => {
        const div = document.createElement("div");
        div.className = "item";
        const b = document.createElement("button");
        b.textContent = "Avanzar estado";
        b.onclick = async () => {
          const r = await api(`/ordenes/${o.id}/estado`, { method: "PATCH" });
          if (r.ok) {
            setStatus("Estado actualizado");
            cargarOrdenes();
          } else {
            const e = await r.json().catch(() => ({}));
            alert(e.error || "Error");
          }
        };
        const span = document.createElement("span");
        span.className = "estado";
        span.textContent = o.estado;
        div.innerHTML = `<div><strong>#${o.id}</strong> · ${o.plato}${
          o.extras ? ` (${o.extras})` : ""
        }</div>`;
        div.append(span);
        if (o.estado !== "delivered") div.append(b);
        cont.append(div);
      });
    })
    .catch(() => setStatus("Error cargando órdenes"));
}

document.getElementById("registro-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    nombre: $("#reg-nombre").value.trim(),
    email: $("#reg-correo").value.trim(),
    telefono: $("#reg-telefono").value.trim(),
  };
  const r = await api("/clientes/registrar", { method: "POST", body: JSON.stringify(body) });
  const data = await r.json();
  if (r.ok) {
    setStatus("Registro exitoso, ahora inicia sesión.");
  } else {
    alert(data.error || "Error");
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    email: $("#log-correo").value.trim(),
    telefono: $("#log-telefono").value.trim(),
  };
  const r = await api("/clientes/login", { method: "POST", body: JSON.stringify(body) });
  const data = await r.json();
  if (r.ok) {
    state.cliente = data;
    localStorage.setItem("cliente", JSON.stringify(data));
    showApp();
  } else {
    alert(data.error || "Error");
  }
});

document.getElementById("orden-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    cliente_id: state.cliente.id,
    plato: $("#orden-plato").value.trim(),
    extras: $("#orden-extras").value.trim(),
  };
  const r = await api("/ordenes", { method: "POST", body: JSON.stringify(body) });
  const data = await r.json();
  if (r.ok) {
    setStatus(`Orden #${data.id} creada`);
    $("#orden-plato").value = "";
    $("#orden-extras").value = "";
    cargarOrdenes();
  } else {
    alert(data.error || "Error");
  }
});

// Restaurar sesión si existe
try {
  const saved = localStorage.getItem("cliente");
  if (saved) {
    state.cliente = JSON.parse(saved);
    showApp();
  }
} catch {}
