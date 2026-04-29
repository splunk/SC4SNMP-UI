import React from 'react';
import { expect, describe, jest, it, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/dom';
import { act } from 'react-dom/test-utils';
import { render, screen } from './custom_testing_lib/custom-testing-lib';
import "@testing-library/jest-dom";
import "@testing-library/jest-dom";
import LoginPage from "../components/auth/LoginPage";
import { MockAuthContextProvider } from "./mock_context_providers/MockAuthContextProvider";

jest.mock("../api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            response: { use: jest.fn() },
        },
    },
}));

function renderLoginPage(overrides = {}) {
    return render(
        <MockAuthContextProvider overrides={overrides}>
            <LoginPage />
        </MockAuthContextProvider>
    );
}

describe("LoginPage", () => {
    it("renders username and password fields", async () => {
        await act(async () => renderLoginPage());

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        expect(usernameInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
    });

    it("renders Sign in button disabled when fields are empty", async () => {
        await act(async () => renderLoginPage());

        const signInButton = screen.getByText("Sign in");
        expect(signInButton.closest("button")).toBeDisabled();
    });

    it("enables Sign in button when both fields are filled", async () => {
        await act(async () => renderLoginPage());

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        await act(async () => {
            fireEvent.change(usernameInput, { target: { value: "admin" } });
            fireEvent.change(passwordInput, { target: { value: "password" } });
        });

        const signInButton = screen.getByText("Sign in");
        expect(signInButton.closest("button")).not.toBeDisabled();
    });

    it("calls login on submit", async () => {
        const mockLogin = jest.fn(() => Promise.resolve({ data: { username: "admin" } }));
        await act(async () => renderLoginPage({ login: mockLogin }));

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        await act(async () => {
            fireEvent.change(usernameInput, { target: { value: "admin" } });
            fireEvent.change(passwordInput, { target: { value: "password" } });
        });

        const signInButton = screen.getByText("Sign in");
        await act(async () => {
            fireEvent.click(signInButton);
        });

        expect(mockLogin).toHaveBeenCalledWith("admin", "password");
    });

    it("shows error on login failure", async () => {
        const mockLogin = jest.fn(() => Promise.reject({ response: { status: 401 } }));
        await act(async () => renderLoginPage({ login: mockLogin }));

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        await act(async () => {
            fireEvent.change(usernameInput, { target: { value: "admin" } });
            fireEvent.change(passwordInput, { target: { value: "wrong" } });
        });

        const signInButton = screen.getByText("Sign in");
        await act(async () => {
            fireEvent.click(signInButton);
        });

        expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
    });

    it("shows rate limit error on 429", async () => {
        const mockLogin = jest.fn(() => Promise.reject({ response: { status: 429 } }));
        await act(async () => renderLoginPage({ login: mockLogin }));

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        await act(async () => {
            fireEvent.change(usernameInput, { target: { value: "admin" } });
            fireEvent.change(passwordInput, { target: { value: "wrong" } });
        });

        const signInButton = screen.getByText("Sign in");
        await act(async () => {
            fireEvent.click(signInButton);
        });

        expect(screen.getByText("Too many login attempts. Please wait a moment.")).toBeInTheDocument();
    });

    it("renders the application title", async () => {
        await act(async () => renderLoginPage());
        expect(screen.getByText("Splunk Connect for SNMP")).toBeInTheDocument();
    });

    it("shows session expired notice when provided by auth context", async () => {
        await act(async () => renderLoginPage({
            sessionExpiredMessage: "Your session expired. Please sign in again.",
        }));

        expect(screen.getByText("Your session expired. Please sign in again.")).toBeInTheDocument();
    });

    it("hides session expired notice when a login error is present", async () => {
        const mockLogin = jest.fn(() => Promise.reject({ response: { status: 401 } }));
        const mockClear = jest.fn();
        await act(async () => renderLoginPage({
            login: mockLogin,
            sessionExpiredMessage: "Your session expired. Please sign in again.",
            clearSessionExpiredMessage: mockClear,
        }));

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        await act(async () => {
            fireEvent.change(usernameInput, { target: { value: "admin" } });
            fireEvent.change(passwordInput, { target: { value: "wrong" } });
        });

        const signInButton = screen.getByText("Sign in");
        await act(async () => {
            fireEvent.click(signInButton);
        });

        expect(mockClear).toHaveBeenCalled();
        expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
        expect(screen.queryByText("Your session expired. Please sign in again.")).not.toBeInTheDocument();
    });
});
