import { describe, expect, it } from "vitest";
import { homeImageUrl } from "../../src/utils/homeImages";

describe("homeImageUrl", () => {
  it("replaces only the size while preserving Adidas options, path and query bytes", () => {
    expect(homeImageUrl("https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/a%2Fb/image.jpg?v=0123", 480))
      .toBe("https://assets.adidas.com/images/w_480,f_auto,q_auto,fl_lossy,c_fill,g_auto/a%2Fb/image.jpg?v=0123");
    expect(homeImageUrl("https://assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg", 192))
      .toBe("https://assets.adidas.com/images/w_192,f_auto,q_auto/a.jpg");
  });

  it.each([
    "https://assets.adidas.com.evil.test/images/w_500,f_auto,q_auto/a.jpg",
    "https://evil.test/assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg?signature=abc",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg?v=1&token=secret",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg?expires=123",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg?X-Amz-Signature=abc",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/a.jpg#fragment",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto,other/a.jpg",
    "https://www.hiperatos.com/cdn/shop/files/a.jpg?width=500",
    "https://example.com/a.jpg?w=1200&h=1200&fit=pad",
    "not a url",
    "",
  ])("leaves unverified or sensitive input untouched: %s", (url) => {
    expect(homeImageUrl(url, 480)).toBe(url);
  });
});
