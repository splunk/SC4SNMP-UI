import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import AuthContext from '../../store/auth-contxt';

const LoginWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #171d21;
`;

const LoginCard = styled.div`
    width: 380px;
    padding: 40px;
    border-radius: 8px;
    background-color: #1a1f25;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const Title = styled.div`
    text-align: center;
    margin-bottom: 32px;

    & > P {
        font-family: 'Proxima Nova Bold';
        font-weight: 700;
        font-size: 22px;
        line-height: 28px;
        color: #ffffff;
    }
`;

const FieldGroup = styled.div`
    margin-bottom: 16px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    color: #c3cbd4;
`;

function LoginPage() {
    const authCtx = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        setError("");
        if (authCtx.clearSessionExpiredMessage) {
            authCtx.clearSessionExpiredMessage();
        }
        setLoading(true);
        authCtx.login(username, password)
            .catch((err) => {
                if (err.response && err.response.status === 429) {
                    setError("Too many login attempts. Please wait a moment.");
                } else {
                    setError("Invalid username or password");
                }
                setLoading(false);
            });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <LoginWrapper>
            <LoginCard>
                <Title>
                    <P>Splunk Connect for SNMP</P>
                </Title>
                {error && (
                    <Message type="error" style={{ marginBottom: '16px' }}>
                        {error}
                    </Message>
                )}
                {!error && authCtx.sessionExpiredMessage && (
                    <Message type="info" style={{ marginBottom: '16px' }}>
                        {authCtx.sessionExpiredMessage}
                    </Message>
                )}
                <FieldGroup>
                    <Label htmlFor="login-username">Username</Label>
                    <Text
                        inputId="login-username"
                        value={username}
                        onChange={(e, { value }) => setUsername(value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter username"
                        autoFocus
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label htmlFor="login-password">Password</Label>
                    <Text
                        inputId="login-password"
                        type="password"
                        value={password}
                        onChange={(e, { value }) => setPassword(value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter password"
                    />
                </FieldGroup>
                <Button
                    appearance="primary"
                    label={loading ? "Signing in..." : "Sign in"}
                    onClick={handleSubmit}
                    disabled={loading || !username || !password}
                    style={{ width: '100%', marginTop: '8px', fontFamily: 'Proxima Nova Sbold' }}
                />
            </LoginCard>
        </LoginWrapper>
    );
}

export default LoginPage;
