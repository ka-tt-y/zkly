export type SubjectDisplayMode = 'hashed' | 'plaintext';

export interface SubjectShape {
  subjectCommitment?: string;
  subjectDisplay?: string;
  subjectDisplayMode?: SubjectDisplayMode;
}

export async function hashSubjectValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return BigInt(`0x${hashHex.slice(0, 62)}`).toString();
}

export function encodeSubjectPlaintext(value: string): string {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length === 0) {
    return '0';
  }

  // Keep the plaintext encoding safely within the BN254 field range used by the circuits.
  if (bytes.length > 31) {
    throw new Error('Plaintext subject values must be 31 characters or fewer. Use hash mode for longer values.');
  }

  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return BigInt(`0x${hex}`).toString();
}

export async function buildSubjectBinding(
  value: string,
  mode: SubjectDisplayMode,
): Promise<{
  subjectCommitment: string;
  subjectDisplay: string;
  subjectDisplayMode: SubjectDisplayMode;
}> {
  const subjectDisplay = value.trim();

  if (mode === 'plaintext') {
    return {
      subjectCommitment: encodeSubjectPlaintext(subjectDisplay),
      subjectDisplay,
      subjectDisplayMode: 'plaintext',
    };
  }

  return {
    subjectCommitment: await hashSubjectValue(subjectDisplay),
    subjectDisplay: await hashSubjectValue(subjectDisplay),
    subjectDisplayMode: 'hashed',
  };
}

export function resolveSubjectDisplayMode(
  shape: SubjectShape,
): SubjectDisplayMode | undefined {
  return shape.subjectDisplayMode;
}

export function resolveSubjectDisplay(shape: SubjectShape): string | undefined {
  return shape.subjectDisplay;
}

export function resolveSubjectCommitment(shape: SubjectShape): string | undefined {
  return shape.subjectCommitment;
}
