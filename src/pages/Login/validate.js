export function ValidateLogin(email) {
    const errors = {};

    if (!email.trim()) {
        errors.email = "Email is required";
    }

    return errors;
}