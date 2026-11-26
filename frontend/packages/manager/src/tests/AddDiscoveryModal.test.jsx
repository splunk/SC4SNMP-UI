import React, { act } from 'react';
import {expect, describe, jest, it, beforeEach} from '@jest/globals';
import {fireEvent} from '@testing-library/dom';
import api from "../api";
import {render, screen} from './custom_testing_lib/custom-testing-lib'
import "@testing-library/jest-dom"
import AddDiscoveryModal from "../components/discovery/AddDiscoveryModal";
import {MockDiscoveryContextProvider, discoveryMocks} from "./mock_context_providers/MockDiscoveryContextProvider";
import {DiscoveryValidationContextProvider} from "../store/discovery-validation-contxt";
import {MockErrorsContextProvider} from "./mock_context_providers/MockErrorsContextProvider";

jest.mock("../api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            response: { use: jest.fn() },
        },
    },
}))

const queryTest = (id) => document.querySelector(`[data-test="${id}"]`);
const sleep = ms => new Promise(r => { setTimeout(r, ms); });

function renderModal(props = {}){
    return render(
        <MockErrorsContextProvider>
            <MockDiscoveryContextProvider {...props}>
                <DiscoveryValidationContextProvider>
                    <AddDiscoveryModal/>
                </DiscoveryValidationContextProvider>
            </MockDiscoveryContextProvider>
        </MockErrorsContextProvider>
    );
}

const input = (name) => screen.getByDataTest(`sc4snmp:discovery:${name}-input`).querySelector("input");
const type = (name, value) => fireEvent.change(input(name), {target: {value}});
const ruleInputs = (testId) => screen.getAllByDataTest(testId).map((el) => el.querySelector("input"));

const baseEntry = (overrides = {}) => ({
    name: "office-lan", networkAddress: "10.0.0.0/24", version: "2c", port: "161", community: "public",
    secret: "", securityEngine: "", frequency: "86400", deleteAlreadyDiscovered: false, deviceRules: [],
    ...overrides,
});

describe("AddDiscoveryModal", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        discoveryMocks.makeChange.mockReset();
        api.get.mockResolvedValue({data: ["routers", "linux"]});
    });

    it("blocks submit and shows errors for invalid data", async () => {
        await act(async () => renderModal());
        type("name", "1bad");
        type("networkAddress", "nope");
        type("community", "");
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);

        expect(api.post).not.toHaveBeenCalled();
        expect(screen.getByText("Name cannot start with a digit or contain whitespace or semicolons.")).toBeInTheDocument();
        expect(screen.getByText("Enter a valid IPv4 or IPv6 CIDR.")).toBeInTheDocument();
        expect(screen.getByText("Community is required for SNMP v1 and v2c.")).toBeInTheDocument();
    });

    it("clears a field error when the field changes", async () => {
        await act(async () => renderModal());
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);
        expect(screen.getByText("Name is required.")).toBeInTheDocument();
        type("name", "office");
        expect(screen.queryByText("Name is required.")).not.toBeInTheDocument();
    });

    it("posts a valid new entry to /discovery/add", async () => {
        api.post.mockResolvedValue({data: "success"});
        await act(async () => renderModal({initialEntry: baseEntry()}));
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);

        expect(api.post).toHaveBeenCalledTimes(1);
        const [url, payload] = api.post.mock.calls[0];
        expect(url).toBe("/discovery/add");
        expect(payload).toMatchObject({name: "office-lan", networkAddress: "10.0.0.0/24", community: "public"});
        expect(discoveryMocks.makeChange).toHaveBeenCalled();
    });

    it("posts to /discovery/update/<id> on edit and keeps the name read-only", async () => {
        api.post.mockResolvedValue({data: "success"});
        await act(async () => renderModal({initialEntry: baseEntry(), initialIsEdit: true, initialEntryId: "abc123"}));
        expect(input("name")).toBeDisabled();
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);
        expect(api.post.mock.calls[0][0]).toBe("/discovery/update/abc123");
    });

    it("shows the IPv6 hint only for IPv6 networks and warns about very large subnets", async () => {
        await act(async () => renderModal());
        expect(queryTest("sc4snmp:discovery:ipv6-hint")).not.toBeInTheDocument();
        expect(queryTest("sc4snmp:discovery:large-subnet-warning")).not.toBeInTheDocument();
        type("networkAddress", "10.0.0.0/8");
        expect(screen.getByDataTest("sc4snmp:discovery:large-subnet-warning")).toBeInTheDocument();
        expect(queryTest("sc4snmp:discovery:ipv6-hint")).not.toBeInTheDocument();
        type("networkAddress", "2001:db8::/64");
        expect(screen.getByDataTest("sc4snmp:discovery:ipv6-hint")).toBeInTheDocument();
        expect(screen.getByDataTest("sc4snmp:discovery:large-subnet-warning")).toBeInTheDocument();
    });

    it("does not send credentials that do not belong to the selected version", async () => {
        api.post.mockResolvedValue({data: "success"});
        await act(async () => renderModal({initialEntry: baseEntry({
            version: "3", community: "leftover", secret: "my-secret", securityEngine: "aabbccdd1234",
        })}));
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);
        expect(api.post.mock.calls[0][1]).toMatchObject({version: "3", community: "", secret: "my-secret"});

        api.post.mockClear();
        await act(async () => renderModal({initialEntry: baseEntry({
            version: "2c", community: "public", secret: "stale", securityEngine: "aabbccdd1234",
        })}));
        fireEvent.click(screen.getAllByDataTest("sc4snmp:discovery:submit")[1]);
        await sleep(10);
        expect(api.post.mock.calls[0][1]).toMatchObject({version: "2c", community: "public", secret: "", securityEngine: ""});
    });

    it("shows secret and engine fields only for v3", async () => {
        await act(async () => renderModal({initialEntry: baseEntry({version: "3", community: "", secret: "s"})}));
        expect(screen.getByDataTest("sc4snmp:discovery:secret-input")).toBeInTheDocument();
        expect(queryTest("sc4snmp:discovery:community-input")).not.toBeInTheDocument();
        expect(input("secret")).toHaveAccessibleDescription(
            "The secret name must also be listed in discovery.usernameSecrets in Helm values."
        );
        expect(input("securityEngine")).toHaveAttribute("placeholder", "optional");
        expect(input("securityEngine")).toHaveAccessibleDescription(
            "If left empty it will be discovered during runtime."
        );
        expect(screen.getByText("Delete already discovered")).toBeInTheDocument();
    });

    it("keeps device rule order and supports moving rules up and down", async () => {
        api.post.mockResolvedValue({data: "success"});
        const rules = [
            {id: "1", name: "first", patterns: "*a*", group: "routers"},
            {id: "2", name: "second", patterns: "*b*", group: "linux"},
        ];
        await act(async () => renderModal({initialEntry: baseEntry({deviceRules: rules})}));
        expect(ruleInputs("sc4snmp:discovery:rule-name").map((i) => i.value)).toEqual(["first", "second"]);

        fireEvent.click(screen.getAllByDataTest("sc4snmp:discovery:rule-down")[0]);
        expect(ruleInputs("sc4snmp:discovery:rule-name").map((i) => i.value)).toEqual(["second", "first"]);
        fireEvent.click(screen.getAllByDataTest("sc4snmp:discovery:rule-up")[1]);
        expect(ruleInputs("sc4snmp:discovery:rule-name").map((i) => i.value)).toEqual(["first", "second"]);
        fireEvent.click(screen.getAllByDataTest("sc4snmp:discovery:rule-up")[1]);

        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);
        const sent = api.post.mock.calls[0][1].deviceRules;
        expect(sent.map((r) => r.name)).toEqual(["second", "first"]);
        expect(sent[0]).toEqual({name: "second", patterns: "*b*", group: "linux"});
    });

    it("reports per-rule validation errors and accepts a free-text group", async () => {
        await act(async () => renderModal({initialEntry: baseEntry()}));
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:add-rule"));
        fireEvent.change(ruleInputs("sc4snmp:discovery:rule-group")[0], {target: {value: "not-yet-created"}});
        expect(ruleInputs("sc4snmp:discovery:rule-group")[0].value).toBe("not-yet-created");
        fireEvent.click(screen.getByDataTest("sc4snmp:discovery:submit"));
        await sleep(10);
        expect(api.post).not.toHaveBeenCalled();
        expect(screen.getByText("Rule 1: name, patterns are required.")).toBeInTheDocument();
        const removeButton = screen.getByRole("button", {name: "Remove rule"});
        expect(removeButton).not.toHaveTextContent("Remove rule");
        fireEvent.click(removeButton);
        expect(queryTest("sc4snmp:discovery:rule-name")).not.toBeInTheDocument();
    });
});
