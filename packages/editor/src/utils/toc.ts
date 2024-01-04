export function getTableOfContents(content: HTMLElement) {
  const headings = content.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const tableOfContents: {
    level: number;
    title: string | null;
    id: string | null;
    top: number;
  }[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const level = parseInt(heading.tagName[1]);
    const title = heading.textContent;
    const id = heading.getAttribute("data-block-id");
    tableOfContents.push({
      level,
      title,
      id,
      top: (heading as HTMLElement).offsetTop
    });
  }

  return tableOfContents;
}

export function scrollIntoViewById(id: string) {
  const element = document.querySelector(`[data-block-id="${id}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  }
}
