// Background service worker: drives the real listeners registered by background.js
require("../setup-hybrid");

const SEARCH = "https://tpl.bibliocommons.com/v2/search?query=";

describe("Background Script Chrome API Integration", () => {
  beforeEach(() => {
    // setup-hybrid's beforeEach flushes sinon-chrome (listeners included),
    // so re-register the worker's listeners for every test.
    setupChromeApiMocks();
    jest.isolateModules(() => require("../../background.js"));
  });

  const openedUrl = () => chrome.tabs.create.getCall(0).args[0].url;

  test("creates the context menu on install", () => {
    chrome.runtime.onInstalled.trigger();

    expect(
      chrome.contextMenus.create.calledOnceWith({
        id: "searchTPL",
        title: "Search on TPL",
        contexts: ["selection"],
      }),
    ).toBe(true);
  });

  describe("context menu clicks", () => {
    const click = (info) => chrome.contextMenus.onClicked.trigger(info, { id: 1 });

    test("opens an encoded TPL search for the selection", () => {
      click({ menuItemId: "searchTPL", selectionText: "  Author: Smith & Jones " });

      expect(openedUrl()).toBe(`${SEARCH}Author%3A%20Smith%20%26%20Jones`);
      expect(chrome.tabs.create.getCall(0).args[0].active).toBe(true);
    });

    test("searches a cleaned ISBN", () => {
      click({ menuItemId: "searchTPL", selectionText: "978-0-123-45678-6" });

      expect(openedUrl()).toBe(`${SEARCH}9780123456786`);
    });

    test.each([
      ["no selection", { menuItemId: "searchTPL", selectionText: "" }],
      ["whitespace-only selection", { menuItemId: "searchTPL", selectionText: "   " }],
      ["another menu item", { menuItemId: "other", selectionText: "Some text" }],
    ])("ignores %s", (_label, info) => {
      click(info);

      expect(chrome.tabs.create.called).toBe(false);
    });
  });

  describe("runtime messages", () => {
    const send = (message) => {
      const sendResponse = jest.fn();
      chrome.runtime.onMessage.trigger(message, {}, sendResponse);
      return sendResponse;
    };

    test("searchTPL opens a search and acknowledges", () => {
      const sendResponse = send({ action: "searchTPL", text: "Search  text" });

      expect(openedUrl()).toBe(`${SEARCH}Search%20text`);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test("other actions are ignored", () => {
      const sendResponse = send({ action: "unknownAction", text: "x" });

      expect(chrome.tabs.create.called).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe("processSearchText", () => {
    test("truncates long text to 200 characters", () => {
      expect(processSearchText("a".repeat(250))).toHaveLength(200);
    });

    test("falls back to the trimmed original when nothing survives cleaning", () => {
      expect(processSearchText("   ")).toBe("");
    });

    test("encodes injection-looking input instead of passing it through", () => {
      const url = SEARCH + encodeURIComponent(processSearchText('<script>alert("x")</script>'));

      expect(url).not.toContain("<script>");
    });
  });
});
