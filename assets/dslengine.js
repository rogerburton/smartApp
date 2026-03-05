// moteur dsl
// 1) Helpers: path + interpolation
function getPath(obj, path) {
  return String(path)
    .split(".")
    .reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// Keep unknown placeholders intact, so {{item.xxx}} survives until _for binds item.
function interpolateKeepUnknown(str, data) {
  return String(str).replace(/\{\{\s*([^\}]+)\s*\}\}/g, (full, p) => {
    const v = getPath(data, p.trim());
    return v === undefined || v === null ? full : String(v);
  });
}

// 2) Filtrex: compile cache + safe boolean eval
const _fxCache = new Map();
function fx(expr) {
  expr = String(expr ?? "").trim();
  if (!expr) return () => false;
  if (!_fxCache.has(expr)) {
    _fxCache.set(
      expr,
      filtrex.compileExpression(expr, {
        customProp: filtrex.useDotAccessOperator,
      })
    );
  }
  return _fxCache.get(expr);
}

function tryFxBool(expr, data) {
  const r = fx(expr)(data);
  if (r && typeof r === "object" && (r instanceof Error || r.I18N_STRING)) {
    // UNKNOWN_PROPERTY : non évaluable dans ce contexte
    if (r.I18N_STRING === "UNKNOWN_PROPERTY") {
      return { unknown: true, value: false, error: r };
    }
    // autres erreurs : on log et false
    console.warn("Filtrex eval error for:", expr, r);
    return { unknown: false, value: false, error: r };
  }
  return { unknown: false, value: !!r, error: null };
}

function fxBool(expr, data) {return tryFxBool(expr, data).value;}


// 3) DOM traversal helper: include root if it's an Element
function elementsIncludingRoot(root) {
  const list = [];
  if (root && root.nodeType === 1) list.push(root); // Element
  if (root && root.querySelectorAll) list.push(...Array.from(root.querySelectorAll("*")));
  return list;
}

// 4) Core: apply directives
function applyDirectivesToFragment(root, data) {
  function removeElement(el) {
    // si root est un clone détaché (pas encore inséré), on signale au parent de SKIP
    if (el === root && root && root.nodeType === 1 && !root.parentNode) {
      return false;
    }
    el.remove();
    return true;
  }

  // ---------- 1) _for d'abord ----------
  const forNodes = root.querySelectorAll ? Array.from(root.querySelectorAll("[_for]")) : [];
  for (const el of forNodes) {
    const rule = (el.getAttribute("_for") || "").trim();
    el.removeAttribute("_for");
    const m = rule.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/);
    if (!m) {el.remove(); continue;}
    const varName = m[1];     // ex: "item"
    const listPath = m[2];    // ex: "items"
    const list = getPath(data, listPath) || [];
    const parent = el.parentNode;

    for (const item of list) {
      const clone = el.cloneNode(true);
      const localData = { ...data, [varName]: item };
      // Interpolation locale (item existe ici)
      clone.innerHTML = interpolateKeepUnknown(clone.innerHTML, localData);
      // Appliquer directives sur le clone.
      // IMPORTANT: si ça retourne false, on n'insère pas le clone.
      const keep = applyDirectivesToFragment(clone, localData);
      if (!keep) continue;
      parent.insertBefore(clone, el);
    }

    // Supprimer le template original
    el.remove();
  }

  // ---------- 2) autres directives ----------
  const all = elementsIncludingRoot(root).reverse();
  for (const el of all) {
    if (!el.hasAttribute) continue;

    // ---- _skipIf (zappe si condition VRAIE)
    // DOM lower-case => "_skipif"
    if (el.hasAttribute("_skipif")) {
      const expr = (el.getAttribute("_skipif") || "").trim();
      const t = expr ? tryFxBool(expr, data) : { unknown: false, value: false };
      // on laisse l'attribut pour une évaluation plus tard (dans un clone _for)
      if (t.unknown) {continue;}
      el.removeAttribute("_skipif");

      if (t.value) {
        const keep = removeElement(el);
        if (!keep) return false; // root détaché -> skip insertion
        continue;
      }
    }

    // ---- _classIf (expr | trueClasses | falseClasses)
    // DOM lower-case => "_classif"
    if (el.hasAttribute("_classif")) {
      const rule = (el.getAttribute("_classif") || "").trim();
      el.removeAttribute("_classif");
      const parts = rule.split("|").map(s => s.trim());
      const expr = parts[0] || "";
      const clsTrue = parts[1] || "";
      const clsFalse = parts[2] || "";

      if (!expr) {
        // default-only (si tu mets "| normal")
        if (clsTrue) el.classList.add(...clsTrue.split(/\s+/).filter(Boolean));
      } else {
        const t = tryFxBool(expr, data);
        if (!t.unknown) {
          const cls = t.value ? clsTrue : clsFalse;
          if (cls) el.classList.add(...cls.split(/\s+/).filter(Boolean));
        }
      }
    }

    // ---- _dataIf -> data-* attributes (multi-règles ; + default par clé)
    // DOM lower-case => "_dataif"
    if (el.hasAttribute("_dataif")) {
      const rule = (el.getAttribute("_dataif") || "").trim();
      el.removeAttribute("_dataif");
      const rules = rule.split(";").map(r => r.trim()).filter(Boolean);
      const matchedKeys = new Set();
      const defaultByKey = new Map();

      for (const r of rules) {
        const parts = r.split("|").map(s => s.trim());
        const expr = parts[0] || "";
        const kv   = parts[1] || "";

        const m = kv.match(/^([A-Za-z_][\w-]*)\s*=\s*(.+)$/);
        if (!m) continue;

        const key = m[1];
        let value = (m[2] ?? "").trim();

        // enlève "..." ou '...'
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        // default : "| tier=silver"
        if (!expr) {
          defaultByKey.set(key, value);
          continue;
        }

        // 1ère règle gagnante par clé
        if (matchedKeys.has(key)) continue;

        const t = tryFxBool(expr, data);
        if (!t.unknown && t.value) {
          el.setAttribute("data-" + key, String(value));
          matchedKeys.add(key);
        }
      }
      // appliquer defaults pour les clés non matchées
      for (const [key, value] of defaultByKey.entries()) {
        if (!matchedKeys.has(key)) {
          el.setAttribute("data-" + key, String(value));
        }
      }
    }

    // ---- _showIf -> display: none si FAUX
    // DOM lower-case => "_showif"
    if (el.hasAttribute("_showif")) {
      const expr = (el.getAttribute("_showif") || "").trim();
      const t = expr ? tryFxBool(expr, data) : { unknown: false, value: false };
      if (t.unknown) {continue;}
      el.removeAttribute("_showif");
      el.style.display = t.value ? "" : "none";
    }

    // ---- _noshowIf -> display: none si VRAI (inverse du showIf)
    // DOM lower-case => "_noshowif"
    if (el.hasAttribute("_noshowif")) {
      const expr = (el.getAttribute("_noshowif") || "").trim();
      const t = expr ? tryFxBool(expr, data) : { unknown: false, value: false };
      if (t.unknown) {continue;}
      el.removeAttribute("_noshowif");
      el.style.display = t.value ? "none" : "";
    }

    // ---- interpolation locale finale
    if (el.innerHTML != null) {
      el.innerHTML = interpolateKeepUnknown(el.innerHTML, data);
    }
  }

  return true;
}


// 5) compileTemplate: dsl -> html string -> DOM directives -> html
function compileTemplate(dsl) {
  const html0 = String(toHTML(dsl));
  return (data) => {
    const tpl = document.createElement("template");
    tpl.innerHTML = html0; // no global interpolation here

    applyDirectivesToFragment(tpl.content, data);

    // Final interpolation for top-level {{...}} that don't rely on _for
    return interpolateKeepUnknown(tpl.innerHTML, data);
  };
}
//END moteur DSL---------------------
  
