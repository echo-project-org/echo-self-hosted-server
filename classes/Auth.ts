import crypto from "node:crypto";

class Auth {
    private static readonly ALGORITHM_NAME: string = "aes-256-cbc";
    private static readonly ALGORITHM_IV_SIZE: number = 16;
    private static readonly ALGORITHM_KEY_SIZE: number = 32;
    private static readonly PBKDF2_NAME: string = "sha256";
    private static readonly PBKDF2_SALT_SIZE: number = 16;
    private static readonly PBKDF2_ITERATIONS: number = 32767;

    /**
     * Encrypts a plaintext string using AES-256-CBC with PBKDF2 key derivation.
     * The result includes a random salt and IV for security.
     * 
     * @param {string} plaintext - The string to encrypt
     * @param {string} password - The password used for key derivation
     * @returns {string} Base64-encoded string containing salt, IV, and ciphertext
     */
    public static encryptString(plaintext, password): string {
        // Generate a 128-bit salt using a CSPRNG.
        let salt = crypto.randomBytes(Auth.PBKDF2_SALT_SIZE);
        // Derive a key using PBKDF2.
        let key = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), salt, Auth.PBKDF2_ITERATIONS, Auth.ALGORITHM_KEY_SIZE, Auth.PBKDF2_NAME);
        // Encrypt and prepend salt.
        let ciphertextAndIvAndSalt = Buffer.concat([salt, Auth.encrypt(Buffer.from(plaintext, "utf8"), key)]);
        // Return as base64 string.
        return ciphertextAndIvAndSalt.toString("base64");
    }

    /**
     * Decrypts a base64-encoded string that was encrypted using encryptString.
     * Extracts the salt and IV, derives the key using PBKDF2, and decrypts the data.
     * 
     * @param {string} base64CiphertextAndIvAndSalt - Base64-encoded string containing salt, IV, and ciphertext
     * @param {string} password - The password used for key derivation (must match the one used for encryption)
     * @returns {string} The decrypted plaintext string
     */
    public static decryptString(base64CiphertextAndIvAndSalt, password): string {
        // Decode the base64.
        let ciphertextAndIvAndSalt = Buffer.from(base64CiphertextAndIvAndSalt, "base64");
        // Create buffers of salt and ciphertextAndIv.
        let salt = ciphertextAndIvAndSalt.slice(0, Auth.PBKDF2_SALT_SIZE);
        let ciphertextAndIv = ciphertextAndIvAndSalt.slice(Auth.PBKDF2_SALT_SIZE);
        // Derive the key using PBKDF2.
        let key = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), salt, Auth.PBKDF2_ITERATIONS, Auth.ALGORITHM_KEY_SIZE, Auth.PBKDF2_NAME);
        // Decrypt and return result.
        return Auth.decrypt(ciphertextAndIv, key).toString("utf8");
    }

    /**
     * Decrypts data using AES-256-CBC algorithm.
     * Expects the input buffer to contain the IV followed by the ciphertext.
     * 
     * @param {Buffer} ciphertextAndIv - Buffer containing IV (first 16 bytes) and ciphertext
     * @param {Buffer} key - The decryption key (32 bytes for AES-256)
     * @returns {Buffer} The decrypted data as a Buffer
     */
    public static decrypt(ciphertextAndIv, key): Buffer {
        // Create buffers of IV and ciphertext.
        let iv = ciphertextAndIv.slice(0, Auth.ALGORITHM_IV_SIZE);
        let ciphertext = ciphertextAndIv.slice(Auth.ALGORITHM_IV_SIZE);
        // Create the cipher instance.
        let decipher = crypto.createDecipheriv(Auth.ALGORITHM_NAME, key, iv);
        // Decrypt and return result.
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    }

    /**
     * Encrypts data using AES-256-CBC algorithm.
     * Generates a random IV and prepends it to the ciphertext.
     * 
     * @param {Buffer} plaintext - The data to encrypt as a Buffer
     * @param {Buffer} key - The encryption key (32 bytes for AES-256)
     * @returns {Buffer} Buffer containing IV (first 16 bytes) followed by ciphertext
     */
    public static encrypt(plaintext, key): Buffer {
        // Generate a 128-bit IV using a CSPRNG.
        let iv = crypto.randomBytes(Auth.ALGORITHM_IV_SIZE);
        // Create the cipher instance.
        let cipher = crypto.createCipheriv(Auth.ALGORITHM_NAME, key, iv);
        // Encrypt and prepend IV.
        let ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        return Buffer.concat([iv, ciphertext]);
    }
}

export default Auth;