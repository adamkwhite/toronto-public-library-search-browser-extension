// Content script: loads the real content.js and drives its listeners.

describe("Content Script", () => {
  let selected;

  beforeEach(() => {
    // setup.js flushes sinon-chrome before each test, so load content.js
    // afterwards to register a fresh onMessage listener.
    selected = "";
    window.getSelection.mockImplementation(() => createMockSelection(selected));
    jest.isolateModules(() => require("../../content.js"));
  });

  const select = (text) => {
    selected = text;
    document.dispatchEvent(new Event("selectionchange"));
  };

  describe("validateSearchText", () => {
    test("accepts and trims normal text", () => {
      expect(validateSearchText("  The Great Gatsby ")).toEqual({
        valid: true,
        text: "The Great Gatsby",
      });
    });

    test.each([null, undefined, "", "   ", 123, {}, []])("rejects %p", (input) => {
      expect(validateSearchText(input).valid).toBe(false);
    });

    test("truncates to 500 characters with a warning", () => {
      const result = validateSearchText("a".repeat(600));

      expect(result.text).toHaveLength(500);
      expect(result.warning).toBe("Text was truncated to 500 characters");
    });

    test("flags special characters as encoded", () => {
      const result = validateSearchText('Book title: "Test & More"');

      expect(result.valid).toBe(true);
      expect(result.info).toBe("Special characters will be encoded for search");
    });
  });

  describe("detectISBN", () => {
    test.each(["0123456789", "012345678X", "0-123-45678-9"])("%s is ISBN-10", (isbn) => {
      expect(detectISBN(isbn).type).toBe("ISBN-10");
    });

    test.each(["9780123456786", "978-0-123-45678-6", "979 0 123 45678 5"])(
      "%s is ISBN-13",
      (isbn) => {
        expect(detectISBN(isbn).type).toBe("ISBN-13");
      },
    );

    // Any 9-13 digit run is a "Possible ISBN" fallback, including wrong-prefix 13-digit strings.
    test.each(["123456789", "12345678901", "123456789012", "9770123456786"])(
      "%s is a possible ISBN",
      (isbn) => {
        expect(detectISBN(isbn)).toMatchObject({ isISBN: true, type: "Possible ISBN" });
      },
    );

    test.each(["Book Title", "12345678", "abcdefghij"])("%s is not an ISBN", (text) => {
      expect(detectISBN(text)).toEqual({ isISBN: false });
    });
  });

  describe("selection tracking", () => {
    test("remembers the latest non-empty selection", () => {
      select("  New selected text ");
      select("");

      expect(window.tplSearchExtension.getLastSelectedText()).toBe("New selected text");
    });
  });

  describe("runtime messages", () => {
    const send = (message) => {
      const sendResponse = jest.fn();
      chrome.runtime.onMessage.trigger(message, {}, sendResponse);
      return sendResponse.mock.calls[0][0];
    };

    test("getSelectedText returns the selection with ISBN info", () => {
      selected = "978-0-123-45678-6";

      expect(send({ action: "getSelectedText" })).toEqual({
        success: true,
        text: "978-0-123-45678-6",
        isbn: { isISBN: true, type: "ISBN-13", cleaned: "9780123456786" },
        warning: undefined,
        info: undefined,
      });
    });

    test("getSelectedText reports an empty selection", () => {
      expect(send({ action: "getSelectedText" })).toEqual({
        success: false,
        error: "No text selected",
      });
    });

    test("searchText forwards to the background script", () => {
      expect(send({ action: "searchText", text: "Dune" })).toEqual({ success: true });
      expect(
        chrome.runtime.sendMessage.calledOnceWith({ action: "searchTPL", text: "Dune" }),
      ).toBe(true);
    });

    test("searchText without text fails", () => {
      expect(send({ action: "searchText" })).toEqual({
        success: false,
        error: "No text provided",
      });
    });

    test("unknown actions fail", () => {
      expect(send({ action: "nope" })).toEqual({ success: false, error: "Unknown action" });
    });
  });
});
