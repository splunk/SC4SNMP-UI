import {expect, describe, it} from '@jest/globals';
import validateDiscovery, {isLargeSubnet} from "../components/validation/ValidateDiscovery";

const valid = () => ({
    name: "office-lan", networkAddress: "10.0.0.0/24", version: "2c", port: "161", community: "public",
    secret: "", securityEngine: "", frequency: "86400", deleteAlreadyDiscovered: false, deviceRules: [],
});

describe("validateDiscovery", () => {
    it("accepts a valid entry", () => {
        const [ok, errors] = validateDiscovery(valid());
        expect(ok).toBe(true);
        Object.values(errors).forEach((list) => expect(list).toEqual([]));
    });

    it.each([
        ["", "Name is required."],
        ["1abc", "Name cannot start with a digit or contain whitespace or semicolons."],
        ["a b", "Name cannot start with a digit or contain whitespace or semicolons."],
        ["a;b", "Name cannot start with a digit or contain whitespace or semicolons."],
    ])("rejects name %p", (name, message) => {
        const [ok, errors] = validateDiscovery({...valid(), name});
        expect(ok).toBe(false);
        expect(errors.name).toEqual([message]);
    });

    it.each(["10.0.0.0", "10.0.0.0/33", "300.0.0.0/24", "abc/24", "10.0.0.0/x", "::1/129", "1:2:3/64", ""])(
        "rejects network %p", (networkAddress) => {
            const [ok, errors] = validateDiscovery({...valid(), networkAddress});
            expect(ok).toBe(false);
            expect(errors.networkAddress).toHaveLength(1);
        });

    it.each(["10.0.0.0/8", "192.168.1.0/24", "fe80::/64", "2001:db8::/32"])("accepts network %p", (networkAddress) => {
        expect(validateDiscovery({...valid(), networkAddress})[0]).toBe(true);
    });

    it.each(["0", "-1", "65536", "abc", "1.5"])("rejects port %p", (port) => {
        const [ok, errors] = validateDiscovery({...valid(), port});
        expect(ok).toBe(false);
        expect(errors.port).toHaveLength(1);
    });

    it.each(["1", "65535"])("accepts port %p", (port) => {
        expect(validateDiscovery({...valid(), port})[0]).toBe(true);
    });

    it("enforces frequency minimum of 21600", () => {
        expect(validateDiscovery({...valid(), frequency: "21599"})[1].frequency).toHaveLength(1);
        expect(validateDiscovery({...valid(), frequency: "21600"})[0]).toBe(true);
        expect(validateDiscovery({...valid(), frequency: "abc"})[1].frequency).toHaveLength(1);
    });

    it("requires community for v1/v2c", () => {
        expect(validateDiscovery({...valid(), community: ""})[1].community).toHaveLength(1);
        expect(validateDiscovery({...valid(), version: "1", community: ""})[1].community).toHaveLength(1);
    });

    it("requires secret for v3 but not community", () => {
        const v3 = {...valid(), version: "3", community: "", secret: ""};
        expect(validateDiscovery(v3)[1].secret).toHaveLength(1);
        expect(validateDiscovery({...v3, secret: "my-secret"})[0]).toBe(true);
    });

    it("validates security engine format", () => {
        const v3 = {...valid(), version: "3", community: "", secret: "s"};
        expect(validateDiscovery({...v3, securityEngine: "zz"})[1].securityEngine).toHaveLength(1);
        expect(validateDiscovery({...v3, securityEngine: "aabbccdd1234"})[0]).toBe(true);
    });

    it("reports which device rule is incomplete", () => {
        const rules = [
            {name: "a", patterns: "*x*", group: "g"},
            {name: "", patterns: "*y*", group: "g"},
            {name: "c", patterns: "", group: ""},
        ];
        const [ok, errors] = validateDiscovery({...valid(), deviceRules: rules});
        expect(ok).toBe(false);
        expect(errors.deviceRules).toEqual([
            "Rule 2: name is required.",
            "Rule 3: patterns, group are required.",
        ]);
    });

    it("detects very large subnets", () => {
        expect(isLargeSubnet("10.0.0.0/8")).toBe(true);
        expect(isLargeSubnet("10.0.0.0/16")).toBe(false);
        expect(isLargeSubnet("2001:db8::/64")).toBe(true);
        expect(isLargeSubnet("2001:db8::/112")).toBe(false);
        expect(isLargeSubnet("")).toBe(false);
    });

    it.each([
        "10.0.0.0/24", "0.0.0.0/0", "2001:db8::/32", "::/0", "fe80::1/64",
        "::ffff:192.0.2.1/128", "64:ff9b::192.0.2.33/96", "2001:db8:0:0:0:0:0:1/128",
    ])("accepts network %s", (networkAddress) => {
        const [ok] = validateDiscovery({...valid(), networkAddress});
        expect(ok).toBe(true);
    });

    it.each([
        "10.0.0.0", "10.0.0/24", "010.0.0.0/24", "300.0.0.0/24", "10.0.0.0/33", "2001:db8::/129",
        "1::2::3/64", "1.2.3.4::/64", "::ffff:192.0.2/128", "2001:db8:0:0:0:0:0:0:1/128", "gggg::/16",
    ])("rejects network %s", (networkAddress) => {
        const [ok, errors] = validateDiscovery({...valid(), networkAddress});
        expect(ok).toBe(false);
        expect(errors.networkAddress.length).toBe(1);
    });

    it.each(["161.0", "1e3", "-1", "0x10", "", " "])("rejects non-integer port '%s'", (port) => {
        const [ok, errors] = validateDiscovery({...valid(), port});
        expect(ok).toBe(false);
        expect(errors.port.length).toBe(1);
    });

    it.each(["21600.0", "2.16e4", ""])("rejects non-integer frequency '%s'", (frequency) => {
        const [ok, errors] = validateDiscovery({...valid(), frequency});
        expect(ok).toBe(false);
        expect(errors.frequency.length).toBe(1);
    });
});
