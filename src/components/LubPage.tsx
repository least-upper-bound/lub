import type { FC } from "hono/jsx";

const EXAMPLE_PAIRS = [
  { a: "犬", b: "猫", hint: "動物" },
  { a: "看護師", b: "飛行機", hint: "産業革命" },
  { a: "おにぎり", b: "ディズニーランド", hint: "娯楽" },
  { a: "BTS(비티에스)", b: "サンタフェ研究所", hint: "組織" },
] as const;

const clientScript = `
(function () {
  var form = document.getElementById("lub-form");
  var inputA = document.getElementById("concept-a");
  var inputB = document.getElementById("concept-b");
  var submitBtn = document.getElementById("submit-btn");
  var resultArea = document.getElementById("result-area");
  var errorArea = document.getElementById("error-area");
  var chips = document.querySelectorAll("[data-concept-a]");

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "探索中…" : "共通祖先を探す";
  }

  function hideResult() {
    resultArea.classList.add("hidden");
    resultArea.innerHTML = "";
  }

  function hideError() {
    errorArea.classList.add("hidden");
    errorArea.textContent = "";
  }

  function showError(message) {
    hideResult();
    errorArea.textContent = message;
    errorArea.classList.remove("hidden");
  }

  function formatConfidence(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    return Math.round(value * 100) + "%";
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showResult(data) {
    hideError();
    var lowConfidence =
      typeof data.confidence === "number" && data.confidence < 0.7;
    var confidenceClass = lowConfidence
      ? "bg-amber-50 text-amber-800"
      : "bg-indigo-50 text-indigo-700";

    var warningHtml = lowConfidence
      ? '<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm leading-relaxed text-amber-800">' +
        "自信度が低めです。別の抽象概念の可能性があります。" +
        "</div>"
      : "";

    resultArea.innerHTML =
      '<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">' +
      '<div class="mb-4 flex items-start justify-between gap-3">' +
      "<div>" +
      '<p class="text-xs font-medium uppercase tracking-wide text-slate-500">共通祖先</p>' +
      '<p class="mt-1 text-2xl font-semibold text-slate-900">' +
      escapeHtml(data.concept || "") +
      "</p>" +
      "</div>" +
      '<div class="rounded-full px-3 py-1 text-sm font-medium ' +
      confidenceClass +
      '">' +
      "自信度 " +
      formatConfidence(data.confidence) +
      "</div>" +
      "</div>" +
      '<div class="border-t border-slate-100 pt-4">' +
      '<p class="text-xs font-medium uppercase tracking-wide text-slate-500">理由</p>' +
      '<p class="mt-1 text-[15px] leading-relaxed text-slate-800">' +
      escapeHtml(data.reason || "") +
      "</p>" +
      "</div>" +
      warningHtml +
      "</div>";
    resultArea.classList.remove("hidden");
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      inputA.value = chip.getAttribute("data-concept-a") || "";
      inputB.value = chip.getAttribute("data-concept-b") || "";
      inputA.focus();
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var conceptA = (inputA.value || "").trim();
    var conceptB = (inputB.value || "").trim();

    if (!conceptA || !conceptB) {
      showError("概念 A と概念 B の両方を入力してください。");
      return;
    }

    if (conceptA.length > 100 || conceptB.length > 100) {
      showError("各概念は 100 文字以内で入力してください。");
      return;
    }

    hideError();
    hideResult();
    setLoading(true);

    try {
      var res = await fetch("/lub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptA: conceptA, conceptB: conceptB }),
      });
      var data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok) {
        if (res.status === 429) {
          showError(data.error || "しばらく経ってからお試しください。");
        } else if (res.status === 400) {
          showError(data.error || "概念 A と概念 B の両方を入力してください。");
        } else if (res.status === 500) {
          showError(
            data.error ||
              "共通祖先を生成できませんでした。再試行してください。",
          );
        } else {
          showError(data.error || "処理中にエラーが発生しました。");
        }
        return;
      }

      if (typeof data.error === "string") {
        showError(data.error);
        return;
      }

      showResult(data);
    } catch (err) {
      showError("通信に失敗しました。しばらく経ってからお試しください。");
    } finally {
      setLoading(false);
    }
  });
})();
`;

export const LubPage: FC = () => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>LUB — 2 つの概念の共通祖先を探す</title>
        <meta
          name="description"
          content="2 つの概念を入力すると、それらが属するより上位の概念（LUB / LCS / LCA）を提示します。"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      brand: {
                        50: '#eef2ff',
                        600: '#4f46e5',
                        700: '#4338ca',
                        900: '#1e1b4b',
                      },
                    },
                  },
                },
              };
            `,
          }}
        />
      </head>
      <body class="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        <div class="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-white shadow-[0_0_0_1px_#f0f0f0]">
          <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-700 text-sm font-bold text-white">
                L
              </div>
              <div>
                <h1 class="text-base font-semibold tracking-tight text-slate-900">
                  LUB
                </h1>
                <p class="text-xs text-slate-500">
                  2 つの概念の共通祖先を探す
                </p>
              </div>
            </div>
          </header>

          <main class="flex-1 px-4 py-5">
            <section class="mb-6">
              <h2 class="text-lg font-semibold text-slate-900">概念を入力</h2>
              <p class="mt-1 text-sm leading-relaxed text-slate-500">
                2 つの概念を入れると、それらを包む上位概念を 1 語で返します。
              </p>

              <form id="lub-form" class="mt-4 space-y-3">
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
                    for="concept-a"
                  >
                    概念 A
                  </label>
                  <input
                    id="concept-a"
                    name="conceptA"
                    type="text"
                    maxlength={100}
                    placeholder="例: 犬"
                    autocomplete="off"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
                    for="concept-b"
                  >
                    概念 B
                  </label>
                  <input
                    id="concept-b"
                    name="conceptB"
                    type="text"
                    maxlength={100}
                    placeholder="例: 猫"
                    autocomplete="off"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <button
                  id="submit-btn"
                  type="submit"
                  class="w-full rounded-2xl bg-indigo-700 px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-indigo-800 active:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  共通祖先を探す
                </button>
              </form>
            </section>

            <section class="mb-6">
              <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                例示ペア
              </p>
              <div class="flex flex-wrap gap-2">
                {EXAMPLE_PAIRS.map((pair) => (
                  <button
                    type="button"
                    data-concept-a={pair.a}
                    data-concept-b={pair.b}
                    class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800"
                    title={`例: ${pair.hint}`}
                  >
                    {pair.a} × {pair.b}
                  </button>
                ))}
              </div>
            </section>

            <div
              id="error-area"
              class="mb-4 hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
              role="alert"
            ></div>

            <section
              id="result-area"
              class="hidden"
              aria-live="polite"
            ></section>
          </main>

          <footer class="border-t border-slate-200 px-4 py-4">
            <p class="text-xs leading-relaxed text-slate-500">
              LLM
              による推論結果です。正確な分類や学術的なオントロジーではありません。
            </p>
          </footer>
        </div>

        <script dangerouslySetInnerHTML={{ __html: clientScript }} />
      </body>
    </html>
  );
};
