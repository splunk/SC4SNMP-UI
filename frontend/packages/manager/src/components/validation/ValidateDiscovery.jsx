const isDigits = (value) => /^\d+$/.test(String(value ?? '').trim());

// Same rules as python's ipaddress: four decimal octets without leading zeros.
const isIPv4 = (address) => {
    const octets = address.split('.');
    return octets.length === 4 && octets.every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
};

// IPv6 with optional "::" compression and an optional embedded IPv4 tail (e.g. ::ffff:192.0.2.1).
const isIPv6 = (address) => {
    if (!address.includes(':') || !/^[0-9a-f:.]+$/i.test(address) || (address.match(/::/g) || []).length > 1) {
        return false;
    }
    const halves = address.split('::');
    const groups = halves.flatMap((half) => (half ? half.split(':') : []));
    let groupCount = groups.length;
    const last = groups[groups.length - 1];
    if (last && last.includes('.')) {
        if (!address.endsWith(last) || !isIPv4(last)) {
            return false;
        }
        groups.pop();
        groupCount += 1; // the IPv4 tail takes the place of two groups
    }
    if (!groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group))) {
        return false;
    }
    return halves.length === 2 ? groupCount < 8 : groupCount === 8;
};

const validateDiscovery = (entry) => {
    const errors = {
        name: [], networkAddress: [], port: [], version: [], community: [], secret: [],
        securityEngine: [], frequency: [], deviceRules: [],
    };
    let valid = true;
    const fail = (field, message) => {
        errors[field].push(message);
        valid = false;
    };

    if (!entry.name?.trim()) {
        fail('name', 'Name is required.');
    } else if (/^[0-9]/.test(entry.name.trim()) || /[;\s]/.test(entry.name.trim())) {
        fail('name', 'Name cannot start with a digit or contain whitespace or semicolons.');
    }

    try {
        const parts = (entry.networkAddress || '').trim().split('/');
        if (parts.length !== 2 || !/^\d+$/.test(parts[1])) {
            throw new Error();
        }
        const [address, bits] = parts;
        const ipv4 = isIPv4(address);
        const maxBits = ipv4 ? 32 : 128;
        if ((!ipv4 && !isIPv6(address)) || Number(bits) > maxBits) {
            throw new Error();
        }
    } catch {
        fail('networkAddress', 'Enter a valid IPv4 or IPv6 CIDR.');
    }

    if (!isDigits(entry.port) || Number(entry.port) < 1 || Number(entry.port) > 65535) {
        fail('port', 'Port must be an integer from 1 to 65535.');
    }
    if (!['1', '2c', '3'].includes(entry.version)) {
        fail('version', 'Select a supported SNMP version.');
    }
    if (['1', '2c'].includes(entry.version) && !(entry.community || '').trim()) {
        fail('community', 'Community is required for SNMP v1 and v2c.');
    }
    if (entry.community && !/^[.a-zA-Z0-9_-]+$/.test(entry.community)) {
        fail('community', 'Community contains unsupported characters.');
    }
    if (entry.version === '3' && !(entry.secret || '').trim()) {
        fail('secret', 'Secret is required for SNMP v3.');
    }
    if (entry.secret && !/^[.a-zA-Z0-9_-]+$/.test(entry.secret)) {
        fail('secret', 'Secret contains unsupported characters.');
    }
    if (entry.securityEngine && !/^([A-F0-9]{10,64}|[a-f0-9]{10,64})$/.test(entry.securityEngine)) {
        fail('securityEngine', 'Security engine must be 10 to 64 hexadecimal characters.');
    }
    if (!isDigits(entry.frequency) || Number(entry.frequency) < 21600) {
        fail('frequency', 'Frequency must be at least 21600 seconds.');
    }
    (entry.deviceRules || []).forEach((rule, index) => {
        const missing = ['name', 'patterns', 'group'].filter((field) => !(rule[field] || '').trim());
        if (missing.length) {
            fail('deviceRules', `Rule ${index + 1}: ${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required.`);
        }
    });
    return [valid, errors];
};

// Non-blocking hint: IPv4 shorter than /16 or IPv6 shorter than /112 means a very large scan.
export const isLargeSubnet = (networkAddress) => {
    const [address, bits] = (networkAddress || '').trim().split('/');
    if (!address || !/^\d+$/.test(bits || '')) {
        return false;
    }
    return address.includes(':') ? Number(bits) < 112 : Number(bits) < 16;
};

export default validateDiscovery;
