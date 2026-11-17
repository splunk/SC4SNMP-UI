import { expect, describe, it } from "@jest/globals";
import api from "../api";

describe("api client", () => {
    it("calls the backend through the same-origin /api prefix", () => {
        expect(api.defaults.baseURL).toBe("/api");
    });

    it("sends credentials and the CSRF header", () => {
        expect(api.defaults.withCredentials).toBe(true);
        expect(api.defaults.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    });
});
