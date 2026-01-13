export function isValidRecord(name: unknown, score: unknown): boolean {
    if (typeof name !== 'string') return false;
    if (name.length < 1 || name.length > 16) return false;
    if (typeof score !== 'number') return false;
    if (!Number.isInteger(score) || score < 0) return false;
    return true;
}