import { test, assert, equal } from "@elements/app";
import { renderMarkdown } from "./markdown";

test("renderMarkdown", () => {
  test("renders headings and emphasis", () => {
    equal(renderMarkdown("## Hi\n\n**bold**").trim(), "<h2>Hi</h2>\n<p><strong>bold</strong></p>");
  });

  test("escapes raw html", () => {
    let html = renderMarkdown("<script>alert(1)</script>");
    assert(!html.includes("<script>"), html);
  });

  test("drops javascript links", () => {
    let html = renderMarkdown("[x](javascript:alert(1))");
    assert(html.includes('href="#"'), html);
  });

  test("keeps https links", () => {
    assert(renderMarkdown("[x](https://example.com)").includes('href="https://example.com"'));
  });
});
