export declare function isValidEmail(value: string): boolean;
export interface PasswordPolicy {
    minLength?: number;
    requireUppercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
}
export declare function isValidPassword(value: string, policy?: PasswordPolicy): boolean;
export declare function isValidPhone(value: string): boolean;
export declare function isValidURL(value: string): boolean;
//# sourceMappingURL=validators.d.ts.map