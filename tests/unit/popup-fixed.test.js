// Popup: renders the real popup.html markup and runs the real popup.js against it.
require("../setup-hybrid");

const fs = require("fs");
const path = require("path");

const POPUP_BODY = fs
  .readFileSync(path.join(__dirname, "../../popup.html"), "utf8")
  .match(/<body>([\s\S]*)<\/body>/)[1];
const SEARCH = "https://tpl.bibliocommons.com/v2/search?query=";

// popup.js does all its work in a DOMContentLoaded handler. Capture that handler and call it
// directly, so handlers from earlier tests don't pile up on the shared jsdom document.
function openPopup({ tabs = [{ id: 1 }], response, lastError } = {}) {
  setupChromeApiMocks();
  chrome.tabs.query.callsArgWith(1, tabs);
  chrome.tabs.sendMessage.callsArgWith(2, response);
  chrome.runtime.lastError = lastError;
  document.body.innerHTML = POPUP_BODY;

  const addListener = jest.spyOn(document, "addEventListener");
  jest.isolateModules(() => require("../../popup.js"));
  const init = addListener.mock.calls.find(([type]) => type === "DOMContentLoaded")[1];
  addListener.mockRestore();
  init();
}

const $ = (id) => document.getElementById(id);
const message = () => $("messageArea").textContent;
const openedUrl = () => chrome.tabs.create.getCall(0).args[0].url;

describe("Popup", () => {
  afterEach(() => {
    delete chrome.runtime.lastError;
  });

  describe("on open", () => {
    test("offers the page selection, truncated", () => {
      openPopup({ response: { success: true, text: "A Very Long Book Title Indeed" } });

      expect($("selectedTextButton").disabled).toBe(false);
      expect($("selectedTextButton").textContent).toBe('Search: "A Very Long Book ..."');
    });

    test("reports a detected ISBN and any warning", () => {
      openPopup({
        response: {
          success: true,
          text: "978-0-123-45678-6",
          isbn: { isISBN: true, type: "ISBN-13", cleaned: "9780123456786" },
          warning: "Text was truncated to 500 characters",
        },
      });

      // The warning replaces the ISBN message; both go through the same message area.
      expect(message()).toBe("Text was truncated to 500 characters");
    });

    test("stays disabled when the content script is unreachable", () => {
      openPopup({ response: undefined, lastError: { message: "No receiver" } });

      expect($("selectedTextButton").disabled).toBe(true);
    });

    test("stays disabled when nothing is selected", () => {
      openPopup({ response: { success: false, error: "No text selected" } });

      expect($("selectedTextButton").disabled).toBe(true);
    });

    test("does nothing without an active tab", () => {
      openPopup({ tabs: [] });

      expect(chrome.tabs.sendMessage.called).toBe(false);
    });
  });

  describe("manual search", () => {
    beforeEach(() => openPopup());

    test("button click opens an encoded search and closes the popup", () => {
      $("searchInput").value = "  Author: Smith & Jones ";
      $("searchButton").click();

      expect(openedUrl()).toBe(`${SEARCH}Author%3A%20Smith%20%26%20Jones`);
      expect(window.close).toHaveBeenCalled();
    });

    test("Enter searches; other keys do not", () => {
      $("searchInput").value = "978 0 123 45678 6";
      $("searchInput").dispatchEvent(new KeyboardEvent("keypress", { key: "a" }));
      expect(chrome.tabs.create.called).toBe(false);

      $("searchInput").dispatchEvent(new KeyboardEvent("keypress", { key: "Enter" }));
      expect(openedUrl()).toBe(`${SEARCH}9780123456786`);
    });

    test("empty input shows an error, typing clears it", () => {
      $("searchButton").click();
      expect(message()).toBe("Please enter search text");

      $("searchInput").dispatchEvent(new Event("input"));
      expect(message()).toBe("");
    });

    test("tab creation failure is shown escaped", () => {
      chrome.tabs.create.throws(new Error("<b>blocked</b>"));
      $("searchInput").value = "Dune";
      $("searchButton").click();

      expect(message()).toBe("Search error: <b>blocked</b>");
      expect($("messageArea").querySelector("b")).toBeNull();
    });
  });

  describe("selected-text search", () => {
    test("searches the selection", () => {
      openPopup({ response: { success: true, text: "Dune" } });
      $("selectedTextButton").disabled = false;
      $("selectedTextButton").click();

      expect(openedUrl()).toBe(`${SEARCH}Dune`);
    });

    test("whitespace-only selection is rejected", () => {
      openPopup({ response: { success: true, text: "   " } });
      $("selectedTextButton").click();

      expect(message()).toBe("Search text cannot be empty");
    });

    test("failed selection lookup shows an error", () => {
      openPopup({ response: { success: false } });
      $("selectedTextButton").disabled = false;
      $("selectedTextButton").click();

      expect(message()).toBe("No text selected or error getting selection");
    });

    test("does nothing without an active tab", () => {
      openPopup({ tabs: [] });
      $("selectedTextButton").disabled = false;
      $("selectedTextButton").click();

      expect(chrome.tabs.create.called).toBe(false);
    });
  });

  describe("processSearchText", () => {
    beforeEach(() => openPopup());

    test.each([null, undefined, 42])("rejects %p", (input) => {
      expect(() => processSearchText(input)).toThrow("Invalid search text");
    });

    test("rejects whitespace-only text", () => {
      expect(() => processSearchText(" \t ")).toThrow("Search text is empty after processing");
    });

    test("truncates long text to 200 characters", () => {
      expect(processSearchText("a".repeat(250))).toHaveLength(200);
    });
  });
});
