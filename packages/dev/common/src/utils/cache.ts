class Cache {
    static get<T>(key: string) {
        const value = localStorage.getItem(key);
        if (value === null) {
            return null;
        }
        try {
            return JSON.parse(value) as T;
        } catch {
            return value;
        }
    }

    static set(key: string, value: string | object) {
        let storageValue;
        if (typeof (value) === 'object') {
            storageValue = JSON.stringify(value);
        } else {
            storageValue = value;
        }
        localStorage.setItem(key, storageValue);
    }

    static remove(key: string) {
        return localStorage.removeItem(key)
    }
}

const cache = Cache;
export {cache};
