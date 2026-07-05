// Renders the blog's markdown-lite content ("## " headings, "- " lists,
// "> " quotes, **bold** inline) as clean article typography. Server-safe.

function renderInline(text, keyPrefix) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-bold text-zinc-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

function parseBlocks(content) {
  const lines = String(content).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let list = null;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "ul", items: list });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith("### ")) {
      flushPara(); flushList();
      blocks.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flushPara(); flushList();
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("> ")) {
      flushPara(); flushList();
      blocks.push({ type: "quote", text: line.slice(2) });
    } else if (line.startsWith("- ")) {
      flushPara();
      list = list || [];
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export default function ArticleBody({ content }) {
  const blocks = parseBlocks(content);

  return (
    <div className="article-body">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="mb-4 mt-11 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-950 first:mt-0">
                {renderInline(b.text, i)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mb-3 mt-8 text-[17px] font-bold tracking-tight text-zinc-950">
                {renderInline(b.text, i)}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="mb-6 space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-[16px] leading-[1.8] text-zinc-700">
                    <span className="mt-[13px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C8A45C]" />
                    <span>{renderInline(item, `${i}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="mb-6 mt-2 rounded-r-[10px] border-l-[3px] border-[#C8A45C] bg-[#fbf8f2] px-6 py-4 text-[16.5px] font-semibold leading-[1.7] text-zinc-800"
              >
                {renderInline(b.text, i)}
              </blockquote>
            );
          default:
            return (
              <p key={i} className="mb-5 text-[16px] leading-[1.85] text-zinc-700">
                {renderInline(b.text, i)}
              </p>
            );
        }
      })}
    </div>
  );
}
