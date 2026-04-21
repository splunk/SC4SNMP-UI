#!/usr/bin/env python3
"""Generate an Argon2id password hash for use in the sc4snmp-ui-auth Kubernetes Secret."""

import getpass
import sys

from argon2 import PasswordHasher


def main():
    password = getpass.getpass("Enter password: ")
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Error: passwords do not match.", file=sys.stderr)
        sys.exit(1)

    if len(password) < 8:
        print("Error: password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    ph = PasswordHasher()
    password_hash = ph.hash(password)

    print(f"\nPassword hash:\n{password_hash}")
    print(
        "\nCreate the Kubernetes Secret:\n"
        "  kubectl create secret generic sc4snmp-ui-auth \\\n"
        "    --namespace sc4snmp \\\n"
        "    --from-literal=username=admin \\\n"
        f"    --from-literal=password_hash='{password_hash}' \\\n"
        "    --from-literal=jwt_secret=\"$(python3 -c \"import secrets; print(secrets.token_hex(32))\")\""
    )


if __name__ == "__main__":
    main()
